import React, { useEffect, useState } from 'react';
import { listSellerProducts, createSellerProduct, updateSellerProduct, deleteSellerProduct } from '../../services/productService';

export default function SellerProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', stock: '', description: '', image: null });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSellerProducts();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateSellerProduct(editing.id, form);
      } else {
        await createSellerProduct(form);
      }
      setForm({ name: '', price: '', stock: '', description: '', image: null });
      setEditing(null);
      await load();
    } catch (e) {
      alert('Lưu sản phẩm thất bại');
      console.error(e);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Xoá sản phẩm này?')) return;
    await deleteSellerProduct(id);
    await load();
  };

  const pick = (p) => {
    setEditing(p);
    setForm({ name: p.name, price: p.price, stock: p.stock, description: p.description || '', image: null });
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h3>Sản phẩm của shop</h3>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input placeholder="Tên" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Giá" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Tồn kho" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <textarea placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="file" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
        <button type="submit">{editing ? 'Cập nhật' : 'Thêm mới'}</button>
        {editing && <button onClick={() => { setEditing(null); setForm({ name: '', price: '', stock: '', description: '', image: null }); }} type="button">Huỷ</button>}
      </form>

      <table>
        <thead><tr><th>ID</th><th>Ảnh</th><th>Tên</th><th>Giá</th><th>Kho</th><th /></tr></thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.image ? <img src={p.image} alt="img" width={48} /> : '-'}</td>
              <td>{p.name}</td>
              <td>{p.price}</td>
              <td>{p.stock}</td>
              <td>
                <button onClick={() => pick(p)}>Sửa</button>
                <button onClick={() => onDelete(p.id)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
