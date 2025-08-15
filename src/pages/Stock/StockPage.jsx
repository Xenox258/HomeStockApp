/* filepath: /home/teob/Documents/Perso/APP_Gest_Courses/gest_stock/src/StockPage.js */
import React, { useContext, useState } from 'react';
import { StockContext } from 'context/StockContext';
import 'styles/StockPage.css';
import StockToolbar from 'components/stock/StockToolbar';

export default function StockPage() {
  const { stock, updateStock, removeFromStock, groups, addGroup, assignProductToGroup } = useContext(StockContext);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editName, setEditName] = useState(''); // Nouveau state pour le nom
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [groupFilter, setGroupFilter] = useState('');
  const [groupBy, setGroupBy] = useState(false);
  const [compact, setCompact] = useState(false);
  const [editGroupId, setEditGroupId] = useState('');   // nouvel état
  const [assigningProduct,setAssigningProduct] = useState(null);   // <-- ajout

  const processed = React.useMemo(() => {
    let data = [...stock];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p =>
        p.nom.toLowerCase().includes(q) ||
        (p.groupName || '').toLowerCase().includes(q) ||
        p.code.includes(q)
      );
    }
    if (groupFilter) {
      data = data.filter(p => p.groupId === groupFilter);
    }
    data.sort((a, b) => {
      let va, vb;
      if (sortKey === 'name') {
        va = (a.groupName || a.nom).localeCompare(b.groupName || b.nom, 'fr');
        return sortDir === 'asc' ? va : -va;
      }
      if (sortKey === 'qty') {
        va = a.quantite; vb = b.quantite;
      } else if (sortKey === 'nutri') {
        const order = { a:1, b:2, c:3, d:4, e:5 };
        va = order[(a.nutriScore || '').toLowerCase()] || 99;
        vb = order[(b.nutriScore || '').toLowerCase()] || 99;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    if (groupBy) {
      // Regroupement par groupName (sinon "Autres")
      const buckets = {};
      for (const p of data) {
        const key = p.groupName || 'Autres';
        (buckets[key] ||= []).push(p);
      }
      return Object.entries(buckets).map(([gname, items]) => ({ group: gname, items }));
    }
    return data;
  }, [stock, search, sortKey, sortDir, groupFilter, groupBy]);

  const handleEdit = (product) => {
    setEditingProduct(product.code);
    setEditQuantity(product.quantite);
    setEditName(product.nom);
    setEditGroupId(product.groupId || '');
  };

  const handleSave = (product) => {
    updateStock(product.code, editQuantity, editName);
    assignProductToGroup(product.code, editGroupId || null);
    setEditingProduct(null);
    setEditName('');
    setEditGroupId('');
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
            : `${stock.length} produit${stock.length > 1 ? 's' : ''} en stock`}
        </p>
      </div>

      <StockToolbar
        search={search}
        onSearch={setSearch}
        sortKey={sortKey}
        onSortKey={setSortKey}
        sortDir={sortDir}
        onSortDir={setSortDir}
        groupFilter={groupFilter}
        onGroupFilter={setGroupFilter}
        groupBy={groupBy}
        onGroupBy={setGroupBy}
        compact={compact}
        onCompact={setCompact}
        groups={groups}
        onAddGroup={addGroup}
      />

      {stock.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Stock vide</h3>
          <p>Commencez par scanner des produits pour les ajouter à votre stock</p>
        </div>
      ) : (
        groupBy ? (
          processed.map(block => (
            <div key={block.group} className="group-block">
              <h2 className="group-title">
                {block.group}{block.group === 'Autres' ? '' : ` (${block.items.length})`}
              </h2>
              <div className={'stock-grid' + (compact ? ' compact' : '')}>
                {block.items.map(product => {
                  const ns = (product.nutriScore || product.nutriscore || '').toLowerCase().trim();
                  return (
                  <div key={product.code} className={'product-card' + (editingProduct === product.code ? ' editing' : '')}>
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
                            {product.groupName && (
                              <span style={{
                                marginLeft: '.4rem',
                                background: '#667eea',
                                color:'#fff',
                                padding:'0.15rem .45rem',
                                borderRadius:'6px',
                                fontSize:'.55rem',
                                letterSpacing:'.5px'
                              }}>
                                {product.groupName}
                              </span>
                            )}
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
                        <div className="group-select-container">
                          <label>Groupe :</label>
                          <select
                            value={editGroupId}
                            onChange={e=>setEditGroupId(e.target.value)}
                            className="group-select"
                          >
                            <option value="">(Aucun)</option>
                            {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
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
                      <>
                        {assigningProduct === product.code ? (
                          <div className="group-assign">
                            <select
                              value={product.groupId || ''}
                              onChange={e=>{
                                assignProductToGroup(product.code, e.target.value || null);
                                setAssigningProduct(null);
                              }}
                            >
                              <option value="">(Aucun groupe)</option>
                              {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button
                              type="button"
                              className="btn-cancel small"
                              onClick={()=>setAssigningProduct(null)}
                            >✗</button>
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
                            <button
                              onClick={()=>setAssigningProduct(product.code)}
                              className="btn btn-success"
                              title="Ajouter ce produit à un groupe"
                            >
                              <span className="btn-icon-char">+</span> Ajouter à
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )})}
              </div>
            </div>
          ))
        ) : (
          <div className={'stock-grid' + (compact ? ' compact' : '')}>
            {processed.map(product => {
              const ns = (product.nutriScore || product.nutriscore || '').toLowerCase().trim();
              return (
              <div key={product.code} className={'product-card' + (editingProduct === product.code ? ' editing' : '')}>
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
                        {product.groupName && (
                          <span style={{
                            marginLeft: '.4rem',
                            background: '#667eea',
                            color:'#fff',
                            padding:'0.15rem .45rem',
                            borderRadius:'6px',
                            fontSize:'.55rem',
                            letterSpacing:'.5px'
                          }}>
                            {product.groupName}
                          </span>
                        )}
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
                    <div className="group-select-container">
                      <label>Groupe :</label>
                      <select
                        value={editGroupId}
                        onChange={e=>setEditGroupId(e.target.value)}
                        className="group-select"
                      >
                        <option value="">(Aucun)</option>
                        {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
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
                  <>
                    {assigningProduct === product.code ? (
                      <div className="group-assign">
                        <select
                          value={product.groupId || ''}
                          onChange={e=>{
                            assignProductToGroup(product.code, e.target.value || null);
                            setAssigningProduct(null);
                          }}
                        >
                          <option value="">(Aucun groupe)</option>
                          {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <button
                          type="button"
                          className="btn-cancel small"
                          onClick={()=>setAssigningProduct(null)}
                        >✗</button>
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
                        <button
                          onClick={()=>setAssigningProduct(product.code)}
                          className="btn btn-success"
                          title="Ajouter ce produit à un groupe"
                        >
                          <span className="btn-icon-char">+</span> Ajouter à
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )})}
          </div>
        )
      )}
    </div>
  );
}