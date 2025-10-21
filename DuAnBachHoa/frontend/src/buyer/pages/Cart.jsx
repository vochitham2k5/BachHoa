import React from 'react';
import { useCart } from '../../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

export default function BuyerCart() {
  const { items, increase, decrease, removeItem, totals, clear } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div>
        <h3>Giỏ hàng</h3>
        <p>Giỏ hàng trống.</p>
        <Link to="/products">Tiếp tục mua sắm</Link>
      </div>
    );
  }

  return (
    <div>
      <h3>Giỏ hàng</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((i) => (
          <div key={i.id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 12 }}>
            <img src={i.image || 'https://via.placeholder.com/80'} alt={i.name} width={80} height={60} style={{ objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{i.name}</div>
              <div>{Number(i.price).toLocaleString()}đ</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="secondary" onClick={() => decrease(i.id)}>-</Button>
              <span>{i.qty}</span>
              <Button variant="secondary" onClick={() => increase(i.id)}>+</Button>
            </div>
            <Button variant="outline" onClick={() => removeItem(i.id)}>Xóa</Button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outline" onClick={clear}>Xóa giỏ hàng</Button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Tạm tính: {totals.subtotal.toLocaleString()}đ</div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={() => navigate('/products')}>Tiếp tục mua</Button>
        <Button onClick={() => navigate('/checkout')}>Thanh toán</Button>
      </div>
    </div>
  );
}