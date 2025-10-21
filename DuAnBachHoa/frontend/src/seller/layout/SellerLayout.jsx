import React from 'react';
import Navbar from '../../shared/components/Navbar';

export default function SellerLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 16 }}>
        <h2>Seller Portal</h2>
        {children}
      </main>
    </div>
  );
}
