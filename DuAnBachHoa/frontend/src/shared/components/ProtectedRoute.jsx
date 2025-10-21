import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ roles = [], children }) {
  const { token, role } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  if (roles.length && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
