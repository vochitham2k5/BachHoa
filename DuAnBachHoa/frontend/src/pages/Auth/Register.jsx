import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Container, Form, Row, ProgressBar } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateRegistration } from '../../utils/validators';
import { useToast } from '../../contexts/ToastContext';

const Register = () => {
  const { register, loading } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', roleChoice: 'BUYER', acceptTerms: false });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const onCheck = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  const onFile = (name) => (e) => setForm(prev => ({ ...prev, [name]: e.target.files?.[0] }));
  const toBase64 = (file) => new Promise((resolve) => { if (!file) return resolve(null); const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); });
  const stepsTotal = useMemo(() => (form.roleChoice === 'BUYER' ? 2 : 3), [form.roleChoice]);
  const progress = useMemo(() => Math.round((step/stepsTotal)*100), [step, stepsTotal]);

  const handleNext = () => {
    const errs = validateRegistration(form);
    if (step === 1) {
      const firstStepFields = ['fullName','email','phone','password','confirmPassword','roleChoice'];
      const filtered = Object.fromEntries(Object.entries(errs).filter(([k]) => firstStepFields.includes(k)));
      setErrors(filtered);
      if (Object.keys(filtered).length) return;
      setStep(2);
      return;
    }
    setErrors(errs);
    if (!Object.keys(errs).length) setStep(Math.min(step+1, stepsTotal));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validateRegistration(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const payload = { ...form };
    const fileKeys = ['avatarFile','logoFile','licenseImageFile','idCardFrontFile','idCardBackFile','bankCardFrontFile','profilePhotoFile','vehiclePhotoFile'];
    for (const k of fileKeys) {
      if (form[k]) payload[`${k.replace('File','')}Base64`] = await toBase64(form[k]);
    }
    const result = await register(payload);
    if (result.ok && result.token) {
      show('Đăng ký Buyer thành công');
      navigate('/');
    } else if (result.ok && result.applicationId) {
      show('Đã gửi hồ sơ. Đang chờ phê duyệt');
      navigate('/applications/status');
    } else {
      show(result.error || 'Đăng ký thất bại', 'danger');
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-2">Đăng ký tài khoản</Card.Title>
              <ProgressBar now={progress} className="mb-3" />
              <Form onSubmit={onSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Họ tên</Form.Label>
                      <Form.Control name="fullName" value={form.fullName} onChange={onChange} isInvalid={!!errors.fullName} />
                      <Form.Control.Feedback type="invalid">{errors.fullName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số điện thoại</Form.Label>
                      <Form.Control name="phone" value={form.phone} onChange={onChange} isInvalid={!!errors.phone} />
                      <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" name="email" value={form.email} onChange={onChange} isInvalid={!!errors.email} />
                      <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vai trò</Form.Label>
                      <Form.Select name="roleChoice" value={form.roleChoice} onChange={(e)=>{ onChange(e); setStep(1); }}>
                        <option value="BUYER">Buyer</option>
                        <option value="SELLER">Seller</option>
                        <option value="SHIPPER">Shipper</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                {form.roleChoice === 'BUYER' && (
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ảnh đại diện (tùy chọn)</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={onFile('avatarFile')} />
                      </Form.Group>
                    </Col>
                  </Row>
                )}
                {(form.roleChoice === 'SELLER' || form.roleChoice === 'SHIPPER') && (
                  <Card className="mb-3" bg="light">
                    <Card.Body>
                      <div className="small text-muted mb-2">Thông tin bổ sung cho {form.roleChoice === 'SELLER' ? 'Seller' : 'Shipper'} (KYC rút gọn)</div>
                      {form.roleChoice === 'SELLER' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Tên cửa hàng</Form.Label>
                              <Form.Control name="shopName" value={form.shopName || ''} onChange={onChange} isInvalid={!!errors.shopName} />
                              <Form.Control.Feedback type="invalid">{errors.shopName}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Danh mục chính</Form.Label>
                              <Form.Control name="shopCategory" value={form.shopCategory || ''} onChange={onChange} isInvalid={!!errors.shopCategory} />
                              <Form.Control.Feedback type="invalid">{errors.shopCategory}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label>Địa chỉ kho</Form.Label>
                              <Form.Control name="shopAddress" value={form.shopAddress || ''} onChange={onChange} isInvalid={!!errors.shopAddress} />
                              <Form.Control.Feedback type="invalid">{errors.shopAddress}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Logo cửa hàng</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('logoFile')} />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Giấy phép kinh doanh</Form.Label>
                              <Form.Control type="file" accept="image/*,.pdf" onChange={onFile('licenseImageFile')} />
                              {errors.licenseImageFile && <div className="text-danger small">{errors.licenseImageFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>CMND/CCCD - Mặt trước</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('idCardFrontFile')} />
                              {errors.idCardFrontFile && <div className="text-danger small">{errors.idCardFrontFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>CMND/CCCD - Mặt sau</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('idCardBackFile')} />
                              {errors.idCardBackFile && <div className="text-danger small">{errors.idCardBackFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Tên ngân hàng</Form.Label>
                              <Form.Control name="bankName" value={form.bankName || ''} onChange={onChange} isInvalid={!!errors.bankName} />
                              <Form.Control.Feedback type="invalid">{errors.bankName}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Số tài khoản</Form.Label>
                              <Form.Control name="bankAccount" value={form.bankAccount || ''} onChange={onChange} isInvalid={!!errors.bankAccount} />
                              <Form.Control.Feedback type="invalid">{errors.bankAccount}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Check type="checkbox" label="Tôi đồng ý với chính sách và điều khoản bán hàng" name="acceptTerms" checked={!!form.acceptTerms} onChange={onCheck} isInvalid={!!errors.acceptTerms} />
                            {errors.acceptTerms && <div className="text-danger small">{errors.acceptTerms}</div>}
                          </Col>
                        </Row>
                      )}
                      {form.roleChoice === 'SHIPPER' && (
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Loại phương tiện</Form.Label>
                              <Form.Select name="vehicleType" value={form.vehicleType || ''} onChange={onChange} isInvalid={!!errors.vehicleType}>
                                <option value="">Chọn</option>
                                <option value="bike">Xe máy</option>
                                <option value="car">Ô tô</option>
                                <option value="van">Van</option>
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">{errors.vehicleType}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Biển số</Form.Label>
                              <Form.Control name="plateNumber" value={form.plateNumber || ''} onChange={onChange} isInvalid={!!errors.plateNumber} />
                              <Form.Control.Feedback type="invalid">{errors.plateNumber}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Giấy phép lái xe</Form.Label>
                              <Form.Control type="file" accept="image/*,.pdf" onChange={onFile('licenseImageFile')} />
                              {errors.licenseImageFile && <div className="text-danger small">{errors.licenseImageFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Ảnh phương tiện</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('vehiclePhotoFile')} />
                              {errors.vehiclePhotoFile && <div className="text-danger small">{errors.vehiclePhotoFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label>Khu vực hoạt động</Form.Label>
                              <Form.Control name="activeArea" value={form.activeArea || ''} onChange={onChange} isInvalid={!!errors.activeArea} />
                              <Form.Control.Feedback type="invalid">{errors.activeArea}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>CMND/CCCD - Mặt trước</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('idCardFrontFile')} />
                              {errors.idCardFrontFile && <div className="text-danger small">{errors.idCardFrontFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>CMND/CCCD - Mặt sau</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('idCardBackFile')} />
                              {errors.idCardBackFile && <div className="text-danger small">{errors.idCardBackFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label>Ảnh chân dung</Form.Label>
                              <Form.Control type="file" accept="image/*" onChange={onFile('profilePhotoFile')} />
                              {errors.profilePhotoFile && <div className="text-danger small">{errors.profilePhotoFile}</div>}
                            </Form.Group>
                          </Col>
                          <Col md={12}>
                            <Form.Check type="checkbox" label="Tôi đồng ý tuân thủ quy định vận chuyển" name="acceptTerms" checked={!!form.acceptTerms} onChange={onCheck} isInvalid={!!errors.acceptTerms} />
                            {errors.acceptTerms && <div className="text-danger small">{errors.acceptTerms}</div>}
                          </Col>
                        </Row>
                      )}
                    </Card.Body>
                  </Card>
                )}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu</Form.Label>
                      <Form.Control type="password" name="password" value={form.password} onChange={onChange} isInvalid={!!errors.password} />
                      <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nhập lại mật khẩu</Form.Label>
                      <Form.Control type="password" name="confirmPassword" value={form.confirmPassword} onChange={onChange} isInvalid={!!errors.confirmPassword} />
                      <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex gap-2">
                  {step > 1 && <Button variant="outline-secondary" onClick={()=>setStep(step-1)} disabled={loading}>Quay lại</Button>}
                  {step < stepsTotal && <Button variant="secondary" onClick={handleNext} disabled={loading}>Tiếp tục</Button>}
                  {step === stepsTotal && <Button type="submit" className="ms-auto" disabled={loading}>Gửi đăng ký</Button>}
                </div>
              </Form>
              <div className="mt-3 small">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
