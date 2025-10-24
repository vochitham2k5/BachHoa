import React from 'react';
import { Navbar as BSNavbar, Container, Nav, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <BSNavbar bg="light" expand="lg" className="mb-3 shadow-sm">
      <Container>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
          </Nav>
          <Nav>
            {user && (
              <>
                {user.roles?.includes('SELLER') && (
                  <NavDropdown title="Seller" id="seller-menu">
                    <NavDropdown.Item as={Link} to="/seller">Dashboard</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/products">Sản phẩm</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/orders">Đơn hàng</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/vouchers">Khuyến mãi</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/seller/profile">Hồ sơ cửa hàng</NavDropdown.Item>
                  </NavDropdown>
                )}
                {user.roles?.includes('SHIPPER') && (
                  <NavDropdown title="Shipper" id="shipper-menu">
                    <NavDropdown.Item as={Link} to="/shipper">Dashboard</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/shipper/new">Đơn mới</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/shipper/active">Đang giao</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/shipper/history">Lịch sử</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/shipper/profile">Hồ sơ</NavDropdown.Item>
                  </NavDropdown>
                )}
                {(user.is_admin || user.roles?.includes('ADMIN')) && (
                  <NavDropdown title="Admin" id="admin-menu">
                    <NavDropdown.Item as={Link} to="/admin">Dashboard</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/applications">Ứng tuyển</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/users">Người dùng</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/products">Sản phẩm</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/orders">Đơn hàng</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/reports">Báo cáo</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/settings">Cấu hình</NavDropdown.Item>
                  </NavDropdown>
                )}
                <Nav.Link as={Link} to="/buyer/orders">Đơn của tôi</Nav.Link>
                <Nav.Link as={Link} to="/profile">Hồ sơ</Nav.Link>
                <Nav.Link disabled>Xin chào, {user.name || user.email}</Nav.Link>
                <Button variant="outline-danger" size="sm" onClick={() => { logout(); navigate('/'); }}>Đăng xuất</Button>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
