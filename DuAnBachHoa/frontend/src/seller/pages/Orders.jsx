import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/seller/orders/');
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const transition = async (id, status) => {
    await api.post(`/seller/orders/${id}/transition/`, { status });
    await load();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Đơn hàng của shop</h3>
      <ul>
        {orders.map(o => (
          <li key={o.id}>
            #{o.id} - {o.status} - Tổng {o.total}
            <div style={{ display: 'inline-flex', gap: 6, marginLeft: 8 }}>
              <button onClick={() => transition(o.id, 'picking')}>Picking</button>
              <button onClick={() => transition(o.id, 'shipping')}>Shipping</button>
              <button onClick={() => transition(o.id, 'completed')}>Completed</button>
              <button onClick={() => transition(o.id, 'cancelled')}>Cancelled</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
