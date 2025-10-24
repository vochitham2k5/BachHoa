import React, { useEffect, useState } from 'react';
import { Navbar, Container, Form, InputGroup, Dropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SellerTopbar = () => {
  const { user, logout } = useAuth();
  const [scope, setScope] = useState('products');
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !(e.target && /input|textarea|select/i.test(e.target.tagName))) {
        e.preventDefault();
        const el = document.getElementById('seller-global-search');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (scope === 'products') navigate(`/seller/products?q=${encodeURIComponent(q)}`);
    else navigate(`/seller/orders?q=${encodeURIComponent(q)}`);
  };

  return (
    <Navbar bg="white" variant="light" className="border-bottom py-2" sticky="top">
      <Container fluid>
        <Navbar.Brand as={Link} to="/seller" className="me-3">Seller</Navbar.Brand>
        <Form onSubmit={onSubmit} className="flex-grow-1">
          <InputGroup>
            <Form.Select size="sm" value={scope} onChange={e => setScope(e.target.value)} aria-label="Chọn phạm vi tìm kiếm">
              <option value="products">Sản phẩm</option>
              <option value="orders">Đơn hàng</option>
            </Form.Select>
            <Form.Control id="seller-global-search" size="sm" placeholder="Tìm theo tên, SKU hoặc mã đơn" value={q} onChange={e => setQ(e.target.value)} />
            <Button size="sm" variant="primary" type="submit">Tìm</Button>
          </InputGroup>
        </Form>
        <div className="d-flex align-items-center gap-2 ms-3">
          <Button as={Link} to="/seller/products#create" size="sm" variant="outline-primary">+ Sản phẩm</Button>
          <Dropdown align="end">
            <Dropdown.Toggle id="seller-profile-menu" size="sm" variant="outline-secondary">{user?.email || 'Tài khoản'}</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Header>{user?.email}</Dropdown.Header>
              <Dropdown.Item as={Link} to="/seller/profile">Hồ sơ</Dropdown.Item>
              <Dropdown.Item as={Link} to="/seller/finance">Tài chính</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={logout}>Đăng xuất</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </Container>
    </Navbar>
  );
};

export default SellerTopbar;
