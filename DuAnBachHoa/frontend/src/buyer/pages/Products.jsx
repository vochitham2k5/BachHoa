import React, { useEffect, useMemo, useState } from 'react';
import { fetchProducts } from '../../services/productService';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import SortBar from '../components/SortBar';
import ProductGrid from '../components/ProductGrid';
import { useCart } from '../../context/CartContext';

export default function BuyerProducts() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const { addItem } = useCart();

  useEffect(() => { fetchProducts().then(setItems).catch(console.error); }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(set).map(c => ({ value: c, label: c }));
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (q) list = list.filter(i => i.name?.toLowerCase().includes(q.toLowerCase()));
    if (category) list = list.filter(i => i.category === category);
    if (sort === 'price_asc') list.sort((a,b) => Number(a.price)-Number(b.price));
    if (sort === 'price_desc') list.sort((a,b) => Number(b.price)-Number(a.price));
    return list;
  }, [items, q, category, sort]);

  return (
    <div>
      <h3>Sản phẩm</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260 }}><SearchBar onSearch={setQ} /></div>
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />
        <SortBar value={sort} onChange={setSort} />
      </div>

      <ProductGrid items={filtered} onAddToCart={(p) => addItem(p, 1)} />
    </div>
  );
}
