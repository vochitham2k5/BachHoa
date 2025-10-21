import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProduct } from '../services/productService';

export default function DetailPage() {
  const { id } = useParams();
  const [p, setP] = useState(null);

  useEffect(() => {
    fetchProduct(id).then(setP).catch(console.error);
  }, [id]);

  if (!p) return <div style={{ padding: 16 }}>Đang tải...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>{p.name}</h2>
      <p>{p.description}</p>
      <p>Giá: {Number(p.price)?.toLocaleString()}đ</p>
    </div>
  );
}