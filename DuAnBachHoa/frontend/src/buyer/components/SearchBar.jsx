import React, { useState } from 'react';

export default function SearchBar({ placeholder = 'Tìm sản phẩm...', onSearch }) {
  const [q, setQ] = useState('');
  const submit = (e) => {
    e.preventDefault();
    onSearch?.(q.trim());
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}
      />
      <button type="submit" style={{ padding: '8px 12px', borderRadius: 8 }}>Tìm</button>
    </form>
  );
}
