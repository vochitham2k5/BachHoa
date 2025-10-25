import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Alert } from 'react-bootstrap';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ApplySeller = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.name || user?.fullName || '',
    phone: user?.profile?.phone || '',
    email: user?.email || '',
    shopName: '',
    shopCategory: '',
    shopAddress: '',
    bankName: '',
    bankAccount: '',
    logoBase64: '',
    licenseImageBase64: '',
    idCardFrontBase64: '',
    idCardBackBase64: '',
    agree: false,
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
    if (!form.shopName || !form.shopAddress) return 'Vui lòng nhập Tên cửa hàng và Địa chỉ kho';
    if (!form.bankName || !form.bankAccount) return 'Vui lòng nhập thông tin ngân hàng';
    if (!form.agree) return 'Bạn cần đồng ý với điều khoản bán hàng';
    return '';
  };

  const submit = async () => {
    setError('');
    const err = validate();
    if (err) { setError(err); return; }
    try {
      const payload = { ...form };
      const res = await api.post('/applications/seller', payload);
      setStatus(res.data.status);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Gửi đăng ký thất bại');
    }
  };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title>Đăng ký Seller</Card.Title>
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
                <Form.Select value="Seller" disabled>
                  <option>Seller</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <fieldset className="border rounded p-3 mb-3">
            <legend className="float-none w-auto px-2 small text-muted">Thông tin bổ sung cho Seller (KYC rút gọn)</legend>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên cửa hàng</Form.Label>
                  <Form.Control name="shopName" value={form.shopName} onChange={onChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Danh mục chính</Form.Label>
                  <Form.Control name="shopCategory" value={form.shopCategory} onChange={onChange} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ kho</Form.Label>
              <Form.Control name="shopAddress" value={form.shopAddress} onChange={onChange} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Logo cửa hàng</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'logoBase64')} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giấy phép kinh doanh</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(e)=>onFile(e,'licenseImageBase64')} />
                </Form.Group>
              </Col>
            </Row>
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
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên ngân hàng</Form.Label>
                  <Form.Control name="bankName" value={form.bankName} onChange={onChange} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Số tài khoản</Form.Label>
                  <Form.Control name="bankAccount" value={form.bankAccount} onChange={onChange} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Check
              type="checkbox"
              id="agree"
              label="Tôi đồng ý với chính sách và điều khoản bán hàng"
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

export default ApplySeller;
