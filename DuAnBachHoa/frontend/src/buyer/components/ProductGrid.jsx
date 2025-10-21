import React from 'react';
import ProductCard from '../../components/ProductCard';

export default function ProductGrid({ items = [], onAddToCart }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
      marginTop: 16,
    }}>
      {items.map(p => (
        <ProductCard key={p.id || p._id} product={p} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
