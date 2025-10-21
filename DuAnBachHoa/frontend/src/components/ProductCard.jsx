import React from 'react';
import Button from './Button';

export default function ProductCard({ product, onAddToCart }) {
  if (!product) return null;
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
      <img
        src={product.images?.[0] || 'https://via.placeholder.com/300x200?text=Product'}
        alt={product.name}
        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
      />
      <div>
        <div style={{ fontWeight: 600 }}>{product.name}</div>
        <div style={{ color: '#374151' }}>{Number(product.price)?.toLocaleString()}đ</div>
      </div>
      <Button onClick={() => onAddToCart?.(product)} fullWidth>
        Thêm vào giỏ
      </Button>
    </div>
  );
}