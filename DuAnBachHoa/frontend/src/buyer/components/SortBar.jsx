import React from 'react';

const options = [
  { value: 'latest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export default function SortBar({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8 }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
