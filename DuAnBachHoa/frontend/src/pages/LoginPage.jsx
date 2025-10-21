import React, { useState } from 'react';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/token/', { username, password });
      localStorage.setItem('token', data.access);
      alert('Đăng nhập thành công');
    } catch (e) {
      alert('Đăng nhập thất bại');
    }
  };

  return (
    <form onSubmit={submit} style={{ padding: 16, display: 'grid', gap: 8 }}>
      <h2>Đăng nhập</h2>
      <input placeholder="Tài khoản" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Mật khẩu" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Đăng nhập</button>
    </form>
  );
}