import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { role, login, logout, token } = useAuth();
  return (
    <header style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/">Buyer</Link>
        <Link to="/products">Sản phẩm</Link>
        <Link to="/seller">Seller</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/picker">Picker</Link>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <small>Role: <b>{role}</b></small>
        {token ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <button onClick={() => login('demo-token', 'buyer')}>Login Buyer</button>
            <button onClick={() => login('demo-token', 'seller')}>Login Seller</button>
            <button onClick={() => login('demo-token', 'admin')}>Login Admin</button>
            <button onClick={() => login('demo-token', 'picker')}>Login Picker</button>
          </>
        )}
      </div>
    </header>
  );
}
