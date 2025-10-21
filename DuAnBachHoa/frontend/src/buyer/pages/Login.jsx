import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function BuyerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    // Demo: bỏ qua gọi API, set role buyer
    login('demo-token', 'buyer');
    alert('Đăng nhập buyer (demo)');
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <h3>Đăng nhập Buyer</h3>
      <input placeholder="Tài khoản" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}
