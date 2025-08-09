import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeOFFProduct } from 'utils/normalizeProductName';
import 'styles/SuggestInput.css';

const CACHE = new Map();
const DEFAULT_SUGGESTIONS = [
  { canonicalName: 'Pâte brisée' },
  { canonicalName: 'Nutella' },
  { canonicalName: 'Lait' },
  { canonicalName: 'Lait de soja' },
  { canonicalName: 'Lait d amande' },
  { canonicalName: 'Pâte feuilletée' },
  { canonicalName: 'Yaourt nature' }
];

export default function ProductSuggestInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Ex: Lait, Nutella, Pâte brisée…',
  minLength = 2,
  name = 'product'
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const abortRef = useRef(null);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external value
  useEffect(() => { setQuery(value || ''); }, [value]);

  const fetchSuggestions = useCallback(async (q) => {
    const key = q.toLowerCase().trim();
    if (CACHE.has(key)) {
      setSuggestions(CACHE.get(key));
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,product_name_fr,generic_name,brands,nutrition_grade_fr,image_front_small_url,image_front_url,image_url,categories_tags,labels_tags,ingredients_tags,allergens_tags`;
      const resp = await fetch(url, { signal: controller.signal });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const prods = (data.products || [])
        .map(p => {
          const n = normalizeOFFProduct(p);
            return {
              canonicalName: n.canonicalName || (p.product_name_fr || p.product_name || '').trim(),
              nutriScore: n.nutriScore || null,
              imageUrl: n.imageUrl || null
            };
        })
        .filter(p => p.canonicalName)
        .reduce((acc, cur) => {
          if (!acc.some(a => a.canonicalName.toLowerCase() === cur.canonicalName.toLowerCase())) acc.push(cur);
          return acc;
        }, []);
      const list = prods.length ? prods : DEFAULT_SUGGESTIONS;
      CACHE.set(key, list);
      setSuggestions(list);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setSuggestions(DEFAULT_SUGGESTIONS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    if (!query || query.trim().length < minLength) {
      setSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }
    const id = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(id);
  }, [query, fetchSuggestions, minLength]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const apply = (sugg) => {
    onChange?.(sugg.canonicalName);
    onSelect?.(sugg.canonicalName, sugg);
    setQuery(sugg.canonicalName);
    setOpen(false);
    setHighlight(-1);
  };

  const onKey = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown') { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlight(h => Math.min((h + 1), suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlight(h => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && suggestions[highlight]) {
        apply(suggestions[highlight]);
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlight(-1);
    }
  };

  return (
    <div className="suggest-wrapper" ref={boxRef}>
      <input
        ref={inputRef}
        name={name}
        className="suggest-input"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); setOpen(true); }}
        onKeyDown={onKey}
      />
      {loading && <div className="suggest-loading">⏳</div>}
      {open && suggestions.length > 0 && (
        <ul className="suggest-list" role="listbox">
          {suggestions.map((s, idx) => {
            const active = idx === highlight;
            return (
              <li
                key={s.canonicalName + idx}
                className={'suggest-item' + (active ? ' active' : '')}
                onMouseEnter={() => setHighlight(idx)}
                onMouseLeave={() => setHighlight(-1)}
                onMouseDown={(e) => { e.preventDefault(); apply(s); }}
                role="option"
                aria-selected={active}
                title={s.canonicalName}
              >
                {s.imageUrl && <img src={s.imageUrl} alt="" className="suggest-thumb" loading="lazy" />}
                <span className="suggest-text">{s.canonicalName}</span>
                {s.nutriScore && (
                  <span className={`suggest-nutri ns-${s.nutriScore}`}>
                    {s.nutriScore.toUpperCase()}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}