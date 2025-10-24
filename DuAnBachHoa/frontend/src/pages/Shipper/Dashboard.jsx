import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ new: 0, active: 0, completed: 0 });
  useEffect(() => { (async () => { try { const res = await api.get('/api/shipper/stats/'); setStats(res.data || {}); } catch {} })(); }, []);
  return (
    <Container className="py-3">
      <Row className="g-3">
        <Col md={4}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Đơn mới</div><div className="display-6 text-primary">{stats.new}</div></Card.Body></Card></Col>
        <Col md={4}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Đang giao</div><div className="display-6 text-warning">{stats.active}</div></Card.Body></Card></Col>
        <Col md={4}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Hoàn tất</div><div className="display-6 text-success">{stats.completed}</div></Card.Body></Card></Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
