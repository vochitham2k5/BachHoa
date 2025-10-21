import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../services/productService';

export default function ProductPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchProducts().then(setItems).catch(console.error);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Danh sách sản phẩm</h2>
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            <Link to={`/products/${p.id}`}>{p.name} - {Number(p.price)?.toLocaleString()}đ</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}