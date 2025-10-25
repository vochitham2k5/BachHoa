import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  // Hydrate from localStorage so reload không bị out ra trang khác
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (t) setToken(t);
      if (u) setUser(u);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return { ok: true, user: res.data.user };
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Đăng nhập thất bại';
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', payload);
      if (res.data.token) setToken(res.data.token);
      if (res.data.user) setUser(res.data.user);
      return { ok: true, ...res.data };
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Đăng ký thất bại';
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, hydrated, login, register, logout, setUser }), [user, token, loading, hydrated]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
