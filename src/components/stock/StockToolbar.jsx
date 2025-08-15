import React from 'react';

export default function StockToolbar({
  search,onSearch,
  sortKey,onSortKey,
  sortDir,onSortDir,
  groupFilter,onGroupFilter,
  groupBy,onGroupBy,
  compact,onCompact,
  groups,
  onAddGroup
}) {
  const [showAdd,setShowAdd]=React.useState(false);
  const [groupName,setGroupName]=React.useState('');
  const submit=e=>{
    e.preventDefault();
    if(!groupName.trim()) return;
    onAddGroup?.(groupName.trim());
    setGroupName('');
    setShowAdd(false);
  };
  return (
    <div className="stock-toolbar">
      <div className="st-left">
        <input className="st-input" placeholder="Rechercher..."
          value={search} onChange={e=>onSearch(e.target.value)} />
        <select className="st-select" value={groupFilter} onChange={e=>onGroupFilter(e.target.value)}>
          <option value="">Tous les groupes</option>
          {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select className="st-select" value={sortKey} onChange={e=>onSortKey(e.target.value)}>
          <option value="name">Nom</option>
          <option value="qty">Quantité</option>
          <option value="nutri">Nutri-Score</option>
        </select>
        <button type="button" className="st-btn"
          onClick={()=>onSortDir(sortDir==='asc'?'desc':'asc')}
          title="Inverser le tri">{sortDir==='asc'?'⬆️':'⬇️'}</button>
      </div>
      <div className="st-right">
        <label className="st-toggle">
          <input type="checkbox" checked={groupBy} onChange={e=>onGroupBy(e.target.checked)} /> Regrouper
        </label>
        <label className="st-toggle">
          <input type="checkbox" checked={compact} onChange={e=>onCompact(e.target.checked)} /> Vue compacte
        </label>
        <button type="button" className="st-btn" onClick={()=>setShowAdd(s=>!s)}>
          {showAdd? '− Groupe':'＋ Groupe'}
        </button>
      </div>
      {showAdd && (
        <form onSubmit={submit} style={{width:'100%',display:'flex',gap:'.5rem',marginTop:'.6rem'}}>
          <input className="st-input" placeholder="Nom du groupe"
            value={groupName} onChange={e=>setGroupName(e.target.value)} />
          <button className="st-btn" type="submit">Ajouter</button>
        </form>
      )}
    </div>
  );
}