import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Alert } from 'react-bootstrap';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ApplyShipper = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.name || user?.fullName || '',
    phone: user?.profile?.phone || '',
    email: user?.email || '',
    vehicleType: '',
    plateNumber: '',
    activeArea: '',
    licenseImageBase64: '',
    vehiclePhotoBase64: '',
    idCardFrontBase64: '',
    idCardBackBase64: '',
    profilePhotoBase64: '',
    agree: false,
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const fileToBase64 = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const onFile = async (e, key) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const b64 = await fileToBase64(f);
      setForm(prev => ({ ...prev, [key]: b64 }));
    } catch {}
  };

  const validate = () => {
    if (!form.fullName || !form.phone || !form.email) return 'Vui lòng nhập Họ tên, Số điện thoại, Email';
    if (!form.vehicleType || !form.plateNumber || !form.activeArea) return 'Vui lòng nhập loại phương tiện, biển số và khu vực hoạt động';
    if (!form.agree) return 'Bạn cần đồng ý tuân thủ quy định vận chuyển';
    return '';
  };

  const submit = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    try {
      const payload = { ...form };
      const res = await api.post('/applications/shipper', payload);
      setStatus(res.data?.status || 'PENDING');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Gửi đăng ký thất bại');
    }
  };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Đăng ký Shipper</Card.Title>
          {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Họ tên</Form.Label>
                <Form.Control name="fullName" value={form.fullName} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control name="phone" value={form.phone} onChange={onChange} />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control name="email" value={form.email} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select value="Shipper" disabled>
                  <option>Shipper</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <fieldset className="border rounded p-3 mb-3">
            <legend className="float-none w-auto px-2 small text-muted">Thông tin bổ sung cho Shipper (KYC rút gọn)</legend>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại phương tiện</Form.Label>
                  <Form.Select name="vehicleType" value={form.vehicleType} onChange={onChange}>
                    <option value="">Chọn</option>
                    <option value="Motorbike">Xe máy</option>
                    <option value="Car">Ô tô</option>
                    <option value="Truck">Xe tải nhẹ</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Biển số</Form.Label>
                  <Form.Control name="plateNumber" value={form.plateNumber} onChange={onChange} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giấy phép lái xe</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'licenseImageBase64')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ảnh phương tiện</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'vehiclePhotoBase64')} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Khu vực hoạt động</Form.Label>
              <Form.Control name="activeArea" value={form.activeArea} onChange={onChange} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CMND/CCCD - Mặt trước</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'idCardFrontBase64')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>CMND/CCCD - Mặt sau</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'idCardBackBase64')} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Ảnh chân dung</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'profilePhotoBase64')} />
            </Form.Group>
            <Form.Check
              type="checkbox"
              id="agree"
              label="Tôi đồng ý tuân thủ quy định vận chuyển"
              checked={form.agree}
              onChange={(e)=>setForm(f=>({...f, agree: e.target.checked}))}
            />
          </fieldset>
          <div className="d-flex align-items-center gap-2">
            <Button onClick={submit}>Gửi đăng ký</Button>
            <Link to="/applications/status" className="btn btn-outline-secondary">Xem trạng thái hồ sơ</Link>
          </div>
          {status && <div className="mt-2 small">Trạng thái: {status}</div>}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ApplyShipper;
