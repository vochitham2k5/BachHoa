import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role') || 'user');

  const login = (accessToken, userRole = 'user') => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('role', userRole);
    setToken(accessToken);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole('user');
  };

  const value = useMemo(() => ({ token, role, login, logout }), [token, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
