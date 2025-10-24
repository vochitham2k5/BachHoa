import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Container } from 'react-bootstrap';
import api from '../../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const fetchOrders = async () => { const res = await api.get('/seller/orders'); setOrders(res.data || []); };
  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (id, status) => { await api.put(`/seller/orders/${id}/status`, { status }); fetchOrders(); };

  return (
    <Container className="py-3">
      {orders.map(o => (
        <Card className="shadow-sm mb-2" key={o.id}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold">Đơn {o.id}</div>
                <div>Tổng: {o.total?.toLocaleString()} ₫</div>
              </div>
              <div>
                <Badge bg="secondary" className="me-2">{o.status}</Badge>
                <Button size="sm" className="me-1" onClick={() => updateStatus(o.id, 'CONFIRMED')}>Xác nhận</Button>
                <Button size="sm" className="me-1" onClick={() => updateStatus(o.id, 'READY_FOR_PICKUP')}>Đóng gói</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => updateStatus(o.id, 'CANCELLED')}>Hủy</Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default Orders;
