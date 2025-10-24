import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [info, setInfo] = useState({ name: user?.name || '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [addrForm, setAddrForm] = useState({ label: '', recipient_name: '', phone: '', street: '', ward: '', district: '', city: '' });

  useEffect(() => { (async () => { try { const r = await api.get('/api/addresses/'); setAddresses(r.data || []); } catch {} })(); }, []);

  return (
    <Container className="py-3">
      <Row className="g-3">
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Thông tin cá nhân</Card.Title>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Họ tên</Form.Label>
                  <Form.Control value={info.name} onChange={e => setInfo(i => ({ ...i, name: e.target.value }))} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control value={info.phone} onChange={e => setInfo(i => ({ ...i, phone: e.target.value }))} />
                </Form.Group>
                <Button disabled>Lưu (stub)</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <Card.Title>Địa chỉ</Card.Title>
              <Form className="mb-3">
                <Row className="g-2">
                  <Col md={6}><Form.Control placeholder="Nhãn" value={addrForm.label} onChange={e => setAddrForm(a => ({ ...a, label: e.target.value }))} /></Col>
                  <Col md={6}><Form.Control placeholder="Người nhận" value={addrForm.recipient_name} onChange={e => setAddrForm(a => ({ ...a, recipient_name: e.target.value }))} /></Col>
                  <Col md={6}><Form.Control placeholder="Điện thoại" value={addrForm.phone} onChange={e => setAddrForm(a => ({ ...a, phone: e.target.value }))} /></Col>
                  <Col md={6}><Form.Control placeholder="Số nhà, đường" value={addrForm.street} onChange={e => setAddrForm(a => ({ ...a, street: e.target.value }))} /></Col>
                  <Col md={4}><Form.Control placeholder="Phường/Xã" value={addrForm.ward} onChange={e => setAddrForm(a => ({ ...a, ward: e.target.value }))} /></Col>
                  <Col md={4}><Form.Control placeholder="Quận/Huyện" value={addrForm.district} onChange={e => setAddrForm(a => ({ ...a, district: e.target.value }))} /></Col>
                  <Col md={4}><Form.Control placeholder="Tỉnh/Thành" value={addrForm.city} onChange={e => setAddrForm(a => ({ ...a, city: e.target.value }))} /></Col>
                </Row>
                <Button className="mt-2" onClick={async () => { await api.post('/api/addresses/', addrForm); const r = await api.get('/api/addresses/'); setAddresses(r.data || []); setAddrForm({ label: '', recipient_name: '', phone: '', street: '', ward: '', district: '', city: '' }); }}>Thêm địa chỉ</Button>
              </Form>
              {addresses.length === 0 && <div className="text-muted">Chưa có địa chỉ</div>}
              {addresses.map(a => (
                <Card className="shadow-sm mb-2" key={a.id}>
                  <Card.Body className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold">{a.label || a.recipient_name}</div>
                      <div className="small text-muted">{a.street}, {a.district}, {a.city} • {a.phone}</div>
                    </div>
                    <Button size="sm" variant="outline-danger" onClick={async () => { await api.delete(`/api/addresses/${a.id}/`); const r = await api.get('/api/addresses/'); setAddresses(r.data || []); }}>Xóa</Button>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Bảo mật</Card.Title>
              <Button variant="outline-secondary" disabled>Đổi mật khẩu (stub)</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="mt-3">
        <Col>
          <Link to="/seller/apply" className="btn btn-warning me-2">Đăng ký bán hàng</Link>
          <Link to="/applications/status" className="btn btn-outline-primary">Trạng thái hồ sơ</Link>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
