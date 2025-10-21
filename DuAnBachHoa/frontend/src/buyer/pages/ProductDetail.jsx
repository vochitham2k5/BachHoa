import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProduct } from '../../services/productService';

export default function BuyerProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  useEffect(() => { fetchProduct(id).then(setP).catch(console.error); }, [id]);
  if (!p) return <div>Đang tải...</div>;
  return (
    <div>
      <h3>{p.name}</h3>
      <p>{p.description}</p>
      <p>Giá: {Number(p.price)?.toLocaleString()}đ</p>
      <button>Thêm vào giỏ</button>
    </div>
  );
}
