import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import api from '../../services/api';

const Finance = () => {
  const [ledger, setLedger] = useState({ balance: 0, items: [] });
  const [form, setForm] = useState({ amount: '', bankAccount: '', note: '' });
  const [payouts, setPayouts] = useState([]);

  const load = async () => {
    const [l, p] = await Promise.all([
      api.get('/api/seller/finance/ledger'),
      api.get('/api/seller/finance/payouts'),
    ]);
    setLedger(l.data || { balance: 0, items: [] });
    setPayouts(p.data?.items || []);
  };

  const requestPayout = async () => {
    if (!form.amount || !form.bankAccount) return;
    await api.post('/api/seller/finance/payouts', { amount: Number(form.amount), bankAccount: form.bankAccount, note: form.note });
    setForm({ amount: '', bankAccount: '', note: '' });
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <Container className="py-3">
      <Row className="g-3">
        <Col md={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Số dư khả dụng</Card.Title>
              <div className="display-6 text-success">{Math.round(ledger.balance).toLocaleString()} ₫</div>
              <hr />
              <Card.Title>Yêu cầu rút tiền</Card.Title>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label>Số tiền</Form.Label>
                  <Form.Control type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Tài khoản ngân hàng</Form.Label>
                  <Form.Control value={form.bankAccount} onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))} placeholder="VD: Vietcombank - 0123456789 - NGUYEN VAN A" />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </Form.Group>
                <Button onClick={requestPayout}>Gửi yêu cầu</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={7}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <Card.Title>Lịch sử giao dịch</Card.Title>
              <Table striped hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Loại</th>
                    <th>Số tiền</th>
                    <th>Số dư sau</th>
                    <th>Đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.items.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                      <td>{t.type}</td>
                      <td>{(t.amount || 0).toLocaleString()} ₫</td>
                      <td>{(t.balance_after || 0).toLocaleString()} ₫</td>
                      <td>{t.order || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Lịch sử rút tiền</Card.Title>
              <Table striped hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Số tiền</th>
                    <th>Tài khoản</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleString()}</td>
                      <td>{(p.amount || 0).toLocaleString()} ₫</td>
                      <td>{p.bank_account}</td>
                      <td>{p.status}</td>
                      <td>{p.note}</td>
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

export default Finance;
