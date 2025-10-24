import React, { useEffect, useState } from 'react';
import { Button, Card, Container } from 'react-bootstrap';
import api from '../../services/api';

const NewOrders = () => {
  const [orders, setOrders] = useState([]);
  const fetchData = async () => { const res = await api.get('/api/shipper/new/'); setOrders(res.data || []); };
  useEffect(() => { fetchData(); }, []);

  const accept = async (id) => { await api.post('/api/shipper/update/', { orderId: id, action: 'accept' }); fetchData(); };

  return (
    <Container className="py-3">
      {orders.map(o => (
        <Card className="shadow-sm mb-2" key={o.id}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">Đơn {o.id}</div>
              <div>Tổng: {o.total?.toLocaleString()} ₫</div>
            </div>
            <div>
              <Button size="sm" onClick={() => accept(o.id)}>Nhận đơn</Button>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default NewOrders;
