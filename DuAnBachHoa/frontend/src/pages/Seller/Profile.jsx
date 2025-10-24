import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import api from '../../services/api';

const Profile = () => {
  const [form, setForm] = useState({ shop_name: '', bank_name: '', account_number: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => { try { const res = await api.get('/api/seller/profile/'); setForm(res.data || {}); } catch {} })(); }, []);

  const onSave = async () => {
    setSaving(true);
    try { await api.put('/api/seller/profile/', form); } finally { setSaving(false); }
  };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Hồ sơ cửa hàng</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên cửa hàng</Form.Label>
              <Form.Control value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ngân hàng</Form.Label>
              <Form.Control value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số tài khoản</Form.Label>
              <Form.Control value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} />
            </Form.Group>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
