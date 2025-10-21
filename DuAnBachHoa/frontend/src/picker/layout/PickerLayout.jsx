import React from 'react';
import Navbar from '../../shared/components/Navbar';

export default function PickerLayout({ children }) {
  return (
    <div>
      <Navbar />
      <main style={{ padding: 16 }}>
        <h2>Picker/Shipper App</h2>
        {children}
      </main>
    </div>
  );
}
