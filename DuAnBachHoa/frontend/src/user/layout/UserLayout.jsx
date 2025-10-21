import React from 'react';
import Navbar from '../../shared/components/Navbar';

export default function UserLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
