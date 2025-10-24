import React, { useEffect, useState } from 'react';
import { Badge, Card, Container, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { (async () => { const res = await api.get('/api/orders/my/'); setOrders(res.data || []); })(); }, []);

  return (
    <Container className="py-3">
      <Form.Select className="mb-2" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Tất cả trạng thái</option>
        <option value="CREATED">CREATED</option>
        <option value="PAID">PAID</option>
        <option value="CONFIRMED">CONFIRMED</option>
        <option value="PACKED">PACKED</option>
        <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
        <option value="SHIPPING">SHIPPING</option>
        <option value="DELIVERED">DELIVERED</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="CANCELLED">CANCELLED</option>
      </Form.Select>
      {orders.filter(o => !filter || o.status === filter).map(o => (
        <Card className="shadow-sm mb-2" key={o.id}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>Đơn: <Link to={`/buyer/orders/${o.id}`}>#{o.id}</Link></div>
            <div>Trạng thái: <Badge bg="secondary">{o.status}</Badge></div>
            <div>Tổng: {o.total?.toLocaleString()} ₫</div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default Orders;
