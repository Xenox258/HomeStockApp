import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { StockContext } from 'context/StockContext';
import { matchesShoppingItem, normalizeProductName, haveCommonStems } from 'utils/normalizeProductName';
import 'styles/ShoppingListPage.css';
import ProductSuggestInput from 'components/common/ProductSuggestInput';

export default function ShoppingListPage() {
  const { stock, idealStock, manualShoppingList,
    addManualShoppingItem, updateManualShoppingItem,
    removeManualShoppingItem /* clearPurchasedManualItems (non utilisé) */ } = useContext(StockContext);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [showAdd, setShowAdd] = useState(true); // <--- nouveau (par défaut ouvert)

  // Auto deficits (ancien calcul)
  const autoList = idealStock.map((idealProduct) => {
    const current = stock.find(p =>
      matchesShoppingItem(p.nom, idealProduct.nom) ||
      haveCommonStems(normalizeProductName(p.nom), normalizeProductName(idealProduct.nom))
    );
    const currentQuantite = current ? current.quantite : 0;
    const neededQuantite = Math.max(0, idealProduct.quantite - currentQuantite);
    let priority = 'low';
    const percMissing = neededQuantite / idealProduct.quantite;
    if (percMissing >= 0.7) priority = 'high';
    else if (percMissing >= 0.4) priority = 'medium';
    return {
      key: 'auto-' + idealProduct.nom,
      nom: idealProduct.nom,
      quantite: idealProduct.quantite,
      currentQuantite,
      neededQuantite,
      priority,
      manual: false
    };
  }).filter(x => x.neededQuantite > 0);

  // Manual list items (direct quantite)
  const manualListPrepared = manualShoppingList.map(i => ({
    key: 'man-' + i.id,
    id: i.id,
    nom: i.nom,
    neededQuantite: i.quantite,
    priority: 'manual',
    manual: true,
    purchased: i.purchased || false
  }));

  // Merge (simple concat; pas de déduplication inter-lists pour garder l’intention)
  const shoppingList = [...manualListPrepared, ...autoList];

  const totalItems = shoppingList.length;
  const totalNeeded = shoppingList.reduce((s, i) => s + i.neededQuantite, 0);
  const highPriorityItems = shoppingList.filter(i => i.priority === 'high').length; // <- AJOUT

  const addManual = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const clean = newItemName.trim();
    addManualShoppingItem(clean.charAt(0).toUpperCase()+clean.slice(1), Math.max(1, parseInt(newItemQty) || 1));
    setNewItemName('');
    setNewItemQty(1);
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
          <div className="list-header-right">
            {totalNeeded > 0 && (
              <div className="total-needed">
                Total à acheter: {totalNeeded} articles
              </div>
            )}
            <button
              type="button"
              className="add-toggle-btn"
              onClick={() => setShowAdd(s => !s)}
            >
              {showAdd ? '− Fermer' : '+ Ajouter'}
            </button>
          </div>
        </div>

        {showAdd && (
          <form className="manual-add-form" onSubmit={addManual}>
            <ProductSuggestInput
              value={newItemName}
              onChange={setNewItemName}
              onSelect={(val)=> setNewItemName(val)}
              placeholder="Ajouter (ex: Pâte brisée, Lait soja...)"
            />
            <input
              type="number"
              min="1"
              value={newItemQty}
              onChange={e=>setNewItemQty(e.target.value)}
              title="Quantité"
              className="qty-input"   // <-- AJOUT
            />
            <button type="submit">+ Ajouter</button>
          </form>
        )}

        {shoppingList.length === 0 ? (
          <div className="empty-shopping-state">
            <div className="empty-shopping-icon">✅</div>
            <h3>Aucun produit à acheter</h3>
            <p>Ajoutez des articles manuellement ou définissez des objectifs.</p>
            <Link to="/ideal-stock" className="setup-link">
              🎯 Définir des objectifs de stock
            </Link>
          </div>
        ) : (
          <>
            <div className="shopping-grid">
              {shoppingList
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1, manual: 4 };
                  return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                })
                .map(item => (
                  <div
                    key={item.key}
                    className={`shopping-item priority-${item.priority}${item.manual ? ' manual-item' : ''}${item.purchased ? ' purchased' : ''}`}
                  >
                    <div className="shopping-item-header">
                      <div className="shopping-item-info">
                        <h3 className="shopping-item-name">
                          {item.nom}
                          {item.manual && <span className="manual-tag">Manuel</span>}
                        </h3>
                        <div className="shopping-item-details">
                          <div className="target-stock">Quantité: {item.neededQuantite}</div>
                        </div>
                      </div>
                      <div className="needed-badge">{item.neededQuantite}</div>
                    </div>
                    {item.manual && (
                      <div className="shopping-item-actions">
                        <button onClick={() => updateManualShoppingItem(item.id, { purchased: !item.purchased })}>
                          {item.purchased ? '✅ Acheté' : '🛍️ Marquer acheté'}
                        </button>
                        <button onClick={() => removeManualShoppingItem(item.id)}>🗑️ Suppr</button>
                      </div>
                    )}
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