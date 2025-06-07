import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { StockContext } from './StockContext';
import './CSS/ShoppingListPage.css';

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

    // Calcul de la priorité basée sur le pourcentage manquant
    let priority = 'low';
    const percentageMissing = neededQuantite / idealProduct.quantite;
    if (percentageMissing >= 0.7) priority = 'high';
    else if (percentageMissing >= 0.4) priority = 'medium';

    return { 
      ...idealProduct, 
      currentQuantite, 
      neededQuantite, 
      priority 
    };
  }).filter((product) => product.neededQuantite > 0);

  const totalItems = shoppingList.length;
  const totalNeeded = shoppingList.reduce((sum, item) => sum + item.neededQuantite, 0);
  const highPriorityItems = shoppingList.filter(item => item.priority === 'high').length;

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'high': return 'Urgent';
      case 'medium': return 'Important';
      case 'low': return 'Normal';
      default: return 'Normal';
    }
  };

  return (
    <div className="shopping-list-container">
      <div className="shopping-list-header">
        <h1 className="shopping-list-title">🛒 Liste de Courses</h1>
        <p className="shopping-list-subtitle">
          Produits à acheter selon vos objectifs de stock
        </p>
      </div>

      {/* Statistiques */}
      <div className="shopping-stats">
        <div className="stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-number">{totalItems}</div>
          <div className="stat-label">Articles à acheter</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-number">{totalNeeded}</div>
          <div className="stat-label">Quantité totale</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-number">{highPriorityItems}</div>
          <div className="stat-label">Articles urgents</div>
        </div>
      </div>

      <div className="shopping-list-content">
        <div className="list-header">
          <h2 className="list-title">
            📝 Votre liste
            {totalItems > 0 && <span className="items-count">{totalItems}</span>}
          </h2>
          {totalNeeded > 0 && (
            <div className="total-needed">
              Total à acheter: {totalNeeded} articles
            </div>
          )}
        </div>

        {shoppingList.length === 0 ? (
          <div className="empty-shopping-state">
            <div className="empty-shopping-icon">✅</div>
            <h3>Aucun produit à acheter</h3>
            <p>Votre stock actuel correspond à vos objectifs !</p>
            <Link to="/ideal-stock" className="setup-link">
              🎯 Définir des objectifs de stock
            </Link>
          </div>
        ) : (
          <>
            <div className="shopping-grid">
              {shoppingList
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  return priorityOrder[b.priority] - priorityOrder[a.priority];
                })
                .map((product) => (
                <div key={product.nom} className="shopping-item">
                  <div className="shopping-item-header">
                    <div className="shopping-item-info">
                      <h3 className="shopping-item-name">{product.nom}</h3>
                      <div className="shopping-item-details">
                        <div className="current-stock">
                          📦 En stock: {product.currentQuantite}
                        </div>
                        <div className="target-stock">
                          🎯 Objectif: {product.quantite}
                        </div>
                      </div>
                    </div>
                    <div className="needed-badge">
                      {product.neededQuantite}
                    </div>
                  </div>
                  <div className="shopping-item-actions">
                    <div className={`priority-indicator priority-${product.priority}`}>
                      <div className="priority-dot"></div>
                      <span>{getPriorityLabel(product.priority)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="shopping-actions">
              <button 
                className="action-button"
                onClick={() => window.print()}
              >
                🖨️ Imprimer la liste
              </button>
              <Link to="/ideal-stock" className="action-button secondary">
                ⚙️ Modifier les objectifs
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}