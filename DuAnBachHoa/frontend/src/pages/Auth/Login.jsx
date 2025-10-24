import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Login = () => {
  const { login, loading } = useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error || 'Đăng nhập thất bại');
      show(res.error || 'Đăng nhập thất bại', 'danger');
      return;
    }
    const u = res.user || {};
    show('Đăng nhập thành công');
    if (u.is_admin || (u.roles || []).includes('ADMIN')) return navigate('/admin/applications');
    if ((u.roles || []).includes('SELLER')) return navigate('/seller');
    if ((u.roles || []).includes('SHIPPER')) return navigate('/shipper/tasks');
    return navigate('/');
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3">Đăng nhập</Card.Title>
              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control value={password} onChange={e => setPassword(e.target.value)} type="password" required />
                </Form.Group>
                {error && <div className="text-danger small mb-2">{error}</div>}
                <Button type="submit" className="w-100" disabled={loading}>Đăng nhập</Button>
              </Form>
              <div className="mt-3 small">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
