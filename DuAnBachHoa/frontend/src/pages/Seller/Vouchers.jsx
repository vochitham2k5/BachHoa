import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import api from '../../services/api';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState({ code: '', discount_type: 'PERCENT', discount_value: 10, active: true });

  const fetchVouchers = async () => {
    const res = await api.get('/api/seller/vouchers/');
    setVouchers(res.data || []);
  };

  const createVoucher = async () => {
    if (!form.code) return;
    await api.post('/api/seller/vouchers/', form);
    setForm({ code: '', discount_type: 'PERCENT', discount_value: 10, active: true });
    fetchVouchers();
  };

  useEffect(() => { fetchVouchers(); }, []);

  return (
    <Container className="py-3">
      <Row>
        <Col md={5}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <Card.Title>Tạo voucher mới</Card.Title>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Mã</Form.Label>
                  <Form.Control value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="VD: SALE10" />
                </Form.Group>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Loại</Form.Label>
                      <Form.Select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                        <option value="PERCENT">Phần trăm</option>
                        <option value="AMOUNT">Số tiền</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Giá trị</Form.Label>
                      <Form.Control type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: Number(e.target.value) }))} />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Check type="switch" id="active" label="Kích hoạt" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                <Button className="mt-3" onClick={createVoucher}>Tạo</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Danh sách voucher</Card.Title>
              <Table striped hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Loại</th>
                    <th>Giá trị</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id}>
                      <td>{v.code}</td>
                      <td>{v.discount_type}</td>
                      <td>{v.discount_type === 'PERCENT' ? v.discount_value + ' %' : v.discount_value.toLocaleString() + ' ₫'}</td>
                      <td>{v.active ? 'Đang bật' : 'Tắt'}</td>
                      <td>{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Vouchers;
