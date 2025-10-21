import React, { useEffect, useState } from 'react';
import { listOrders } from '../../services/orderService';
import { createPaymentIntent, confirmPayment } from '../../services/paymentService';

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pay = async (orderId) => {
    const { payment_id } = await createPaymentIntent(orderId);
    await confirmPayment(payment_id);
    await load();
  };

  if (loading) return <div>Đang tải...</div>;
  if (!orders.length) return <div>Chưa có đơn hàng</div>;

  return (
    <div>
      <h3>Đơn hàng của tôi</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            #{o.id} - {o.status} - Tổng: {o.total} - {new Date(o.created_at).toLocaleString()}
            {o.status === 'pending' && (
              <button style={{ marginLeft: 8 }} onClick={() => pay(o.id)}>Thanh toán (mock)</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
