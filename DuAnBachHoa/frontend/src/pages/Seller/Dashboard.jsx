import React, { useEffect, useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ todayRevenue: 0, todayOrders: 0, productsCount: 0 });
  useEffect(() => { (async () => { try { const res = await api.get('/api/seller/stats/'); setStats(res.data); } catch {} })(); }, []);

  return (
    <Container className="py-3">
      <Row className="g-3">
        <Col md={4}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Doanh thu hôm nay</div><div className="display-6 text-success">{Math.round(stats.todayRevenue).toLocaleString()} ₫</div></Card.Body></Card></Col>
        <Col md={4}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Đơn hôm nay</div><div className="display-6">{stats.todayOrders}</div></Card.Body></Card></Col>
        <Col md={4}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Sản phẩm đang bán</div><div className="display-6">{stats.productsCount}</div></Card.Body></Card></Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
