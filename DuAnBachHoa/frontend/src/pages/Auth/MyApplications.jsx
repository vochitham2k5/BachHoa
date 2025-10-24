import React, { useEffect, useState } from 'react';
import { Badge, Card, Col, Container, Row } from 'react-bootstrap';
import api from '../../services/api';

const MyApplications = () => {
  const [sellerApps, setSellerApps] = useState([]);
  const [shipperApps, setShipperApps] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, sh] = await Promise.all([
          api.get('/applications/seller/me'),
          api.get('/applications/shipper/me')
        ]);
        setSellerApps(s.data || []);
        setShipperApps(sh.data || []);
      } catch (e) {}
    })();
  }, []);

  const Item = ({ app }) => (
    <Card className="shadow-sm mb-2">
      <Card.Body className="d-flex justify-content-between">
        <div>ID: {app.id}</div>
        <div><Badge bg="info">{app.type}</Badge></div>
        <div>Trạng thái: {app.status}</div>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="py-3">
      <Row>
        <Col md={6}>
          <h6>Seller applications</h6>
          {sellerApps.map(a => <Item key={a.id} app={a} />)}
        </Col>
        <Col md={6}>
          <h6>Shipper applications</h6>
          {shipperApps.map(a => <Item key={a.id} app={a} />)}
        </Col>
      </Row>
    </Container>
  );
};

export default MyApplications;
