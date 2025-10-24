import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import api from '../../services/api';

const Profile = () => {
  const [form, setForm] = useState({ vehicle_type: '', plate_number: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => { try { const res = await api.get('/api/shipper/profile/'); setForm(res.data || {}); } catch {} })(); }, []);

  const onSave = async () => { setSaving(true); try { await api.put('/api/shipper/profile/', form); } finally { setSaving(false); } };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Hồ sơ Shipper</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Phương tiện</Form.Label>
              <Form.Control value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))} placeholder="Xe máy / Xe tải" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Biển số</Form.Label>
              <Form.Control value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} placeholder="XX-123.45" />
            </Form.Group>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
