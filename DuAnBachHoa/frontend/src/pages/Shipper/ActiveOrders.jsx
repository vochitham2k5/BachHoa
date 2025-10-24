import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Container } from 'react-bootstrap';
import api from '../../services/api';

const ActiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const fetchData = async () => { const res = await api.get('/api/shipper/orders/'); setOrders(res.data || []); };
  useEffect(() => { fetchData(); }, []);

  const act = async (id, action) => { await api.post('/api/shipper/update/', { orderId: id, action }); fetchData(); };

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
                <Button size="sm" className="me-1" onClick={() => act(o.id, 'picked')}>Đã lấy</Button>
                <Button size="sm" className="me-1" onClick={() => act(o.id, 'enroute')}>Đang giao</Button>
                <Button size="sm" className="me-1" onClick={() => act(o.id, 'delivered')}>Hoàn tất</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => act(o.id, 'failed')}>Thất bại</Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default ActiveOrders;
