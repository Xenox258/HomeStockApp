import React, { useContext, useState } from 'react';
import { StockContext } from './StockContext';
import { matchesShoppingItem, normalizeProductName, haveCommonStems } from './utils/normalizeProductName';
import './CSS/IdealStockPage.css';

export default function IdealStockPage() {
  const { stock, idealStock, setIdealStockForProduct, removeFromIdealStock } = useContext(StockContext);
  const [nom, setNom] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nom.trim()) {
      setIdealStockForProduct(nom.trim(), quantite);
      setNom('');
      setQuantite(1);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product.nom);
    setEditQuantity(product.quantite);
  };

  const handleSave = (productName) => {
    setIdealStockForProduct(productName, editQuantity);
    setEditingProduct(null);
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setEditQuantity(0);
  };

  const handleDelete = (productName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" du stock cible ?`)) {
      removeFromIdealStock(productName);
    }
  };

  // 🆕 Fonction pour obtenir le statut de chaque produit
  const getProductStatus = (idealProduct) => {
    const currentProduct = stock.find((p) => 
      matchesShoppingItem(p.nom, idealProduct.nom) ||
      haveCommonStems(normalizeProductName(p.nom), normalizeProductName(idealProduct.nom))
    );
    
    const currentQuantite = currentProduct ? currentProduct.quantite : 0;
    const isComplete = currentQuantite >= idealProduct.quantite;
    const percentageComplete = Math.min(100, Math.round((currentQuantite / idealProduct.quantite) * 100));
    
    return {
      currentQuantite,
      isComplete,
      percentageComplete,
      matchedProduct: currentProduct
    };
  };

  return (
    <div className="ideal-stock-container">
      <div className="ideal-stock-header">
        <h1 className="ideal-stock-title">🎯 Stock Cible</h1>
        <p className="ideal-stock-subtitle">
          Définissez les quantités optimales pour chaque produit
        </p>
      </div>

      {/* Formulaire d'ajout */}
      <div className="add-product-card">
        <h2 className="add-product-title">➕ Ajouter un produit</h2>
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label htmlFor="product-name">Nom du produit</label>
            <input
              id="product-name"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Lait, Pain, Pommes..."
              className="product-name-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="product-quantity">Quantité cible</label>
            <input
              id="product-quantity"
              type="number"
              value={quantite}
              onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="product-quantity-input"
              required
            />
          </div>
          <button type="submit" className="add-button">
            ✓ Ajouter au stock cible
          </button>
        </form>
      </div>

      {/* Liste des produits */}
      <div className="ideal-stock-list">
        <h2 className="list-title">
          📋 Vos objectifs de stock 
          <span className="product-count">({idealStock.length})</span>
        </h2>
        
        {idealStock.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>Aucun objectif défini</h3>
            <p>Commencez par ajouter des produits avec leurs quantités cibles</p>
          </div>
        ) : (
          <div className="products-grid">
            {idealStock.map((product) => {
              const status = getProductStatus(product);
              
              return (
                <div key={product.nom} className={`product-card ${status.isComplete ? 'complete' : 'incomplete'}`}>
                  <div className="product-header">
                    <div className="product-info">
                      <h3 className="product-name">{product.nom}</h3>
                      {/* 🆕 Affichage du statut actuel */}
                      <div className="product-status">
                        <div className="status-text">
                          <span className="current-stock">📦 Stock: {status.currentQuantite}</span>
                          <span className="target-stock">🎯 Objectif: {product.quantite}</span>
                        </div>
                        {status.matchedProduct && (
                          <div className="matched-product">
                            <span style={{ fontSize: '0.8em', color: '#666', fontStyle: 'italic' }}>
                              via "{status.matchedProduct.nom}"
                            </span>
                          </div>
                        )}
                        {/* Barre de progression */}
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${status.isComplete ? 'complete' : 'incomplete'}`}
                            style={{ width: `${status.percentageComplete}%` }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {status.percentageComplete}% ({status.currentQuantite}/{product.quantite})
                        </div>
                      </div>
                    </div>
                    <div className={`status-badge ${status.isComplete ? 'complete' : 'incomplete'}`}>
                      {status.isComplete ? '✅' : '⏳'}
                    </div>
                  </div>
                  
                  {editingProduct === product.nom ? (
                    <div className="edit-section">
                      <div className="quantity-input-container">
                        <label>Nouvelle quantité cible :</label>
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          min="1"
                          className="quantity-input"
                        />
                      </div>
                      <div className="edit-buttons">
                        <button 
                          onClick={() => handleSave(product.nom)}
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
                        onClick={() => handleDelete(product.nom)}
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
    </div>
  );
}