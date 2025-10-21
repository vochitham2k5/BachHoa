import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminSellers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/seller-profiles/');
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, kyc_status) => {
    await api.patch(`/seller-profiles/${id}/`, { kyc_status });
    await load();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Seller Applications</h3>
      <ul>
        {items.map(s => (
          <li key={s.id} style={{ marginBottom: 8 }}>
            {s.shop_name} - {s.kyc_status}
            <span style={{ marginLeft: 8, display: 'inline-flex', gap: 6 }}>
              <button onClick={() => setStatus(s.id, 'APPROVED')}>Approve</button>
              <button onClick={() => setStatus(s.id, 'ACTIVE')}>Activate</button>
              <button onClick={() => setStatus(s.id, 'SUSPENDED')}>Suspend</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
