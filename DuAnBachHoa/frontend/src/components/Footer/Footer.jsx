import React from 'react';

export default function Footer() {
  return (
    <footer style={{ marginTop: 40, padding: 16, borderTop: '1px solid #eee', color: '#6b7280' }}>
      <div>© {new Date().getFullYear()} BachHoa. All rights reserved.</div>
    </footer>
  );
}