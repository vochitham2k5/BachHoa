import React, { createContext, useContext, useMemo, useState } from 'react';

const AdminUIContext = createContext(null);

export const AdminUIProvider = ({ children }) => {
  const [title, setTitle] = useState('');
  const [actions, setActions] = useState(null);
  const value = useMemo(() => ({ title, setTitle, actions, setActions }), [title, actions]);
  return <AdminUIContext.Provider value={value}>{children}</AdminUIContext.Provider>;
};

export const useAdminUI = () => {
  const ctx = useContext(AdminUIContext);
  if (!ctx) throw new Error('useAdminUI must be used within AdminUIProvider');
  return ctx;
};
