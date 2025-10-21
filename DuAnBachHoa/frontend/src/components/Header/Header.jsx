import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header style={{ padding: 12, borderBottom: '1px solid #eee', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link to="/" style={{ fontWeight: 700, color: '#0ea5e9', textDecoration: 'none' }}>BachHoa</Link>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/products">Sản phẩm</Link>
          <Link to="/cart">Giỏ hàng</Link>
          <Link to="/orders">Đơn hàng</Link>
        </nav>
      </div>
    </header>
  );
}