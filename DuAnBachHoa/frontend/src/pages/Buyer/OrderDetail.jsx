import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
import api from '../../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const fetchData = async () => { const res = await api.get(`/api/orders/${id}/`); setOrder(res.data); };
  useEffect(() => { fetchData(); /*eslint-disable-next-line*/ }, [id]);

  const cancel = async () => { await api.post(`/api/orders/${id}/cancel/`); fetchData(); };

  if (!order) return null;

  return (
    <Container className="py-3">
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">Đơn #{order.id}</div>
              <div>Trạng thái: <Badge bg="secondary">{order.status}</Badge></div>
            </div>
            <div>
              <Button size="sm" variant="outline-danger" onClick={cancel} disabled={!['CREATED','PAID','CONFIRMED'].includes(order.status)}>Hủy đơn</Button>
            </div>
          </div>
        </Card.Body>
      </Card>
      <Row className="g-3">
        <Col md={8}>
          {(order.items || []).map(it => (
            <Card className="shadow-sm mb-2" key={it.product}>
              <Card.Body className="d-flex justify-content-between">
                <div>SP #{it.product}</div>
                <div>x{it.qty}</div>
                <div>{(it.price * it.qty).toLocaleString()} ₫</div>
              </Card.Body>
            </Card>
          ))}
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between"><span>Tổng</span><strong>{order.total?.toLocaleString()} ₫</strong></div>
              <div className="small text-muted">Thanh toán: {order.payment_method} ({order.payment_status})</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetail;
