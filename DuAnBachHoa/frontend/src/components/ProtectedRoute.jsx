import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, roles, admin = false }) => {
  const { user, token, hydrated } = useAuth();
  if (!hydrated) return null; // tránh redirect sớm khi app đang hydrate
  if (!token) return <Navigate to="/login" replace />;
  if (admin) {
    if (user?.is_admin) return children;
    return <Navigate to="/" replace />;
  }
  if (Array.isArray(roles) && roles.length > 0) {
    const has = user?.roles?.some(r => roles.includes(r));
    if (!has) return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
