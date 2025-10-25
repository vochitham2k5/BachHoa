import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Container, ProgressBar, Row } from 'react-bootstrap';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, buyers: 0, sellers: 0, shippers: 0, revenueTotal: 0, monthlyRevenue: [] });
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/admin/stats/');
        setStats(res.data || {});
      } catch (err) {
        console.error('Failed to load admin stats', err);
        // keep defaults to avoid runtime crash when API fails
        setStats((s) => s);
      }
    })();
  }, []);

  const maxRevenue = useMemo(() => Math.max(1, ...(stats.monthlyRevenue || []).map(m => m.total)), [stats]);

  return (
    <Container className="py-3">
      <Row className="g-3 mb-3">
        <Col md={3}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Người dùng</div><div className="display-6">{stats.users}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Buyer</div><div className="display-6 text-primary">{stats.buyers}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Seller</div><div className="display-6 text-warning">{stats.sellers}</div></Card.Body></Card></Col>
        <Col md={3}><Card className="shadow-sm"><Card.Body className="text-center"><div className="text-muted">Shipper</div><div className="display-6 text-success">{stats.shippers}</div></Card.Body></Card></Col>
      </Row>
      <Row>
        <Col md={6} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Doanh thu theo tháng</Card.Title>
              {(stats.monthlyRevenue || []).map(m => (
                <div key={m.month} className="mb-2">
                  <div className="d-flex justify-content-between small"><span>{m.month}</span><span>{Math.round(m.total).toLocaleString()} ₫</span></div>
                  <ProgressBar now={(m.total / maxRevenue) * 100} />
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Tổng doanh thu</Card.Title>
              <div className="display-5 text-success">{Math.round(stats.revenueTotal).toLocaleString()} ₫</div>
              <div className="text-muted">Lũy kế các đơn trạng thái ĐÃ GIAO</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
