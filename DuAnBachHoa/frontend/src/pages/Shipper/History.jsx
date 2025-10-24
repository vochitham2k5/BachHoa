import React, { useEffect, useState } from 'react';
import { Badge, Card, Container, Form, Row, Col } from 'react-bootstrap';
import api from '../../services/api';

const History = () => {
  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState('');

  const fetchData = async () => { const res = await api.get('/api/shipper/history/'); setOrders(res.data || []); };
  useEffect(() => { fetchData(); }, []);

  const filtered = orders.filter(o => !q || String(o.id).includes(q));

  return (
    <Container className="py-3">
      <Row className="mb-3">
        <Col md={4}><Form.Control placeholder="Tìm đơn theo mã" value={q} onChange={e => setQ(e.target.value)} /></Col>
      </Row>
      {filtered.map(o => (
        <Card className="shadow-sm mb-2" key={o.id}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">Đơn {o.id}</div>
              <div>Tổng: {o.total?.toLocaleString()} ₫</div>
            </div>
            <Badge bg={o.status === 'DELIVERED' ? 'success' : 'secondary'}>{o.status}</Badge>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default History;
