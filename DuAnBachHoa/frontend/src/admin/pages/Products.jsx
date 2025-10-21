import React, { useEffect, useState } from 'react';
import { listAllProducts, setProductActive } from '../../services/adminService';

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (seller) params.seller = seller;
      if (category) params.category = category;
      const data = await listAllProducts(params);
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id, current) => {
    await setProductActive(id, !current);
    await load();
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulk = async (active) => {
    await api.post('/products/bulk-set-active/', { ids: selected, is_active: active });
    setSelected([]);
    await load();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Quản lý sản phẩm</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input placeholder="Seller ID" value={seller} onChange={(e)=>setSeller(e.target.value)} style={{ width: 120 }} />
        <input placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} style={{ width: 160 }} />
        <button onClick={load}>Lọc</button>
        <button onClick={() => bulk(true)} disabled={!selected.length}>Activate chọn</button>
        <button onClick={() => bulk(false)} disabled={!selected.length}>Deactivate chọn</button>
      </div>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Tên</th>
            <th>Giá</th>
            <th>Kho</th>
            <th>Seller</th>
            <th>Active</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id}>
              <td><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>{p.stock}</td>
              <td>{p.seller || '-'}</td>
              <td>{String(p.is_active)}</td>
              <td>
                <button onClick={() => toggle(p.id, p.is_active)}>
                  {p.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
