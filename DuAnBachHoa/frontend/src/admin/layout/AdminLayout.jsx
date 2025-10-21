import React from 'react';
import Navbar from '../../shared/components/Navbar';

export default function AdminLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 16 }}>
        <h2>Admin Panel</h2>
        {children}
      </main>
    </div>
  );
}
