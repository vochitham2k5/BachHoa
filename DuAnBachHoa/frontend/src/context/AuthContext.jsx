import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState('buyer');
  const [ready, setReady] = useState(false);

  const login = (_tokens, userRole = 'buyer') => {
    // cookies are set by backend; just set local state flags
    setToken('cookie');
    setRole(userRole);
  };

  const logout = () => {
    try { api.post('/auth/logout/'); } catch {}
    setToken(null);
    setRole('buyer');
  };

  // Bootstrap session via cookie (if any)
  useEffect(() => {
    (async () => {
      try {
        await api.get('/auth/csrf/'); // ensure csrftoken cookie is set
        const { data } = await api.get('/me/');
        if (data?.id) {
          setRole(data.role || 'buyer');
          setToken('cookie');
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const value = useMemo(() => ({ token, role, login, logout, ready }), [token, role, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
