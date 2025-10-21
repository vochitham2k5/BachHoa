import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function BuyerAddresses() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ line1: '', ward: '', district: '', province: '', phone: '', is_default: false });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/addresses/');
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    await api.post('/addresses/', form);
    setForm({ line1: '', ward: '', district: '', province: '', phone: '', is_default: false });
    await load();
  };

  const setDefault = async (id) => {
    await api.patch(`/addresses/${id}/`, { is_default: true });
    await load();
  };

  const del = async (id) => {
    if (!confirm('Xoá địa chỉ?')) return;
    await api.delete(`/addresses/${id}/`);
    await load();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h3>Sổ địa chỉ</h3>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input placeholder="Địa chỉ" value={form.line1} onChange={(e)=>setForm({ ...form, line1: e.target.value })} />
        <input placeholder="Phường" value={form.ward} onChange={(e)=>setForm({ ...form, ward: e.target.value })} />
        <input placeholder="Quận" value={form.district} onChange={(e)=>setForm({ ...form, district: e.target.value })} />
        <input placeholder="Tỉnh" value={form.province} onChange={(e)=>setForm({ ...form, province: e.target.value })} />
        <input placeholder="SĐT" value={form.phone} onChange={(e)=>setForm({ ...form, phone: e.target.value })} />
        <label><input type="checkbox" checked={form.is_default} onChange={(e)=>setForm({ ...form, is_default: e.target.checked })}/> Đặt mặc định</label>
        <button type="submit">Thêm</button>
      </form>

      <ul>
        {items.map(a => (
          <li key={a.id}>
            {a.line1} {a.ward && ', ' + a.ward} {a.district && ', ' + a.district} {a.province && ', ' + a.province} - {a.phone}
            {a.is_default ? ' (mặc định)' : <button onClick={() => setDefault(a.id)}>Chọn mặc định</button>}
            <button onClick={() => del(a.id)}>Xoá</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
