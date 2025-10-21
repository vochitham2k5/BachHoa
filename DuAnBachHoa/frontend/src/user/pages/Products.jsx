import React from 'react';
import { Link } from 'react-router-dom';

export default function UserProducts() {
  const sample = [
    { id: 1, name: 'Táo', price: 25000 },
    { id: 2, name: 'Sữa', price: 32000 },
  ];
  return (
    <div>
      <h3>Sản phẩm</h3>
      <ul>
        {sample.map((p) => (
          <li key={p.id}><Link to={`/products/${p.id}`}>{p.name} - {p.price.toLocaleString()}đ</Link></li>
        ))}
      </ul>
    </div>
  );
}
