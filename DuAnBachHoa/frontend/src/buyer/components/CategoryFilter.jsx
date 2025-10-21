import React from 'react';

export default function CategoryFilter({ categories = [], value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {categories.map((c) => (
        <button
          key={c.value || c}
          onClick={() => onChange?.(c.value || c)}
          style={{
            padding: '6px 10px',
            borderRadius: 20,
            border: '1px solid #ddd',
            background: (value === (c.value || c)) ? '#0ea5e9' : '#fff',
            color: (value === (c.value || c)) ? '#fff' : '#111',
          }}
        >
          {c.label || c}
        </button>
      ))}
    </div>
  );
}
