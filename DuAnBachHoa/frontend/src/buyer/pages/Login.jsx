import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function BuyerLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    try {
      // Cookie-based login; backend sẽ set HttpOnly cookies
      await api.post('/auth/login/', { username, password });
      const me = await api.get('/me/');
      login({ access: 'cookie', refresh: '' }, me?.data?.role || 'buyer');
      alert('Đăng nhập thành công');
    } catch (err) {
      alert('Đăng nhập thất bại');
      console.error(err);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
  <h3>Đăng nhập</h3>
      <input placeholder="Tài khoản" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}
