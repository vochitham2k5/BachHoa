import React from 'react';
import Navbar from '../../shared/components/Navbar';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

export default function BuyerLayout({ children }) {
  return (
    <div className="buyer-layout">
      <Header />
      <Navbar />
      <main style={{ padding: 16, minHeight: '60vh' }}>{children}</main>
      <Footer />
    </div>
  );
}
