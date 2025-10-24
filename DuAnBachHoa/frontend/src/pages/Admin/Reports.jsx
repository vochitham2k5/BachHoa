import React from 'react';
import { Card, Col, Container, ProgressBar, Row } from 'react-bootstrap';

// Placeholder: You can enhance with real charts (Chart.js) later
const Reports = () => (
  <Container className="py-3">
    <Row className="g-3">
      <Col md={6}><Card className="shadow-sm"><Card.Body><Card.Title>Doanh thu theo tháng</Card.Title><ProgressBar now={60} className="mb-2" /><ProgressBar now={30} className="mb-2" variant="warning" /><ProgressBar now={80} variant="success" /></Card.Body></Card></Col>
      <Col md={6}><Card className="shadow-sm"><Card.Body><Card.Title>Đơn theo trạng thái</Card.Title><ProgressBar now={70} className="mb-2" /><ProgressBar now={20} className="mb-2" variant="warning" /><ProgressBar now={10} variant="danger" /></Card.Body></Card></Col>
    </Row>
  </Container>
);

export default Reports;
