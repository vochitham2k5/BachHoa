import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import api from '../../services/api';

const ApplySeller = () => {
  const [form, setForm] = useState({ shopName: '', bank: { bankName: '', accountNumber: '' } });
  const [status, setStatus] = useState('');
  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async () => {
    const payload = { ...form };
    const res = await api.post('/applications/seller', payload);
    setStatus(res.data.status);
  };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Đăng ký Seller</Card.Title>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tên cửa hàng</Form.Label>
                <Form.Control name="shopName" value={form.shopName} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Ngân hàng</Form.Label>
                <Form.Control name="bankName" value={form.bank.bankName} onChange={e => setForm(f => ({ ...f, bank: { ...f.bank, bankName: e.target.value } }))} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Số tài khoản</Form.Label>
                <Form.Control name="accountNumber" value={form.bank.accountNumber} onChange={e => setForm(f => ({ ...f, bank: { ...f.bank, accountNumber: e.target.value } }))} />
              </Form.Group>
            </Col>
          </Row>
          <Button onClick={submit}>Gửi đăng ký</Button>
          {status && <div className="mt-2 small">Trạng thái: {status}</div>}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ApplySeller;
