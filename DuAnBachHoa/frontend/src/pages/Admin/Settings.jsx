import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import api from '../../services/api';

const Settings = () => {
  const [data, setData] = useState({ bannerTitle: '', bannerSubtitle: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { (async () => { const res = await api.get('/api/admin/settings/'); setData(res.data?.data || {}); })(); }, []);

  const onSave = async () => { setSaving(true); try { await api.put('/api/admin/settings/', { data }); } finally { setSaving(false); } };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Cấu hình hệ thống</Card.Title>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Banner title</Form.Label>
              <Form.Control value={data.bannerTitle || ''} onChange={e => setData(d => ({ ...d, bannerTitle: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Banner subtitle</Form.Label>
              <Form.Control value={data.bannerSubtitle || ''} onChange={e => setData(d => ({ ...d, bannerSubtitle: e.target.value }))} />
            </Form.Group>
            <Button onClick={onSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Settings;
