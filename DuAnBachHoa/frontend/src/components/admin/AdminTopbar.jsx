import React, { useMemo } from 'react';
import { Navbar, Container, Button, Form, Nav, Badge, Dropdown, Breadcrumb } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminUI } from '../../contexts/AdminUIContext';
import { useAuth } from '../../contexts/AuthContext';

const AdminTopbar = ({ onToggleSidebar, onToggleRight, searchRef }) => {
  const { title, actions } = useAdminUI();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const crumbs = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean).slice(0, 3);
    const base = [];
    const items = [];
    parts.forEach((p) => {
      base.push(p);
      items.push({ label: p.charAt(0).toUpperCase() + p.slice(1), to: '/' + base.join('/') });
    });
    return items;
  }, [location.pathname]);
  return (
    <Navbar bg="white" expand="md" className="border-bottom sticky-top" role="navigation" aria-label="Admin topbar">
      <Container fluid>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-secondary" size="sm" onClick={onToggleSidebar} aria-label="Toggle sidebar">
            ☰
          </Button>
          <Navbar.Brand as={Link} to="/admin" className="ms-1">Admin</Navbar.Brand>
        </div>
        <Form className="d-none d-md-flex flex-grow-1 mx-3" role="search" aria-label="Global search">
          <Form.Control
            type="search"
            placeholder="Search (Ctrl+K)"
            ref={searchRef}
            aria-label="Search"
            onKeyDown={(e)=>{ if (e.key==='Enter') { const q = e.currentTarget.value?.trim(); if (q) navigate(`/admin/search?q=${encodeURIComponent(q)}`); } }}
          />
        </Form>
        <div className="d-none d-md-flex align-items-center me-3">
          <Breadcrumb className="mb-0">
            {crumbs.map((c) => (
              <Breadcrumb.Item key={c.to} linkAs={Link} linkProps={{ to: c.to }} active={c.to === location.pathname}>
                {c.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
          {title && <span className="ms-2 fw-semibold">{title}</span>}
        </div>
        <Nav className="ms-auto align-items-center gap-2">
          {actions}
          <Button variant="outline-secondary" size="sm" onClick={onToggleRight} aria-label="Toggle insights panel">⚙️</Button>
          <Nav.Item>
            <Badge bg="secondary" pill title="Notifications">0</Badge>
          </Nav.Item>
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm">{user?.email || 'Admin'}</Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item as={Link} to="/admin/settings">Settings</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => { logout(); navigate('/login'); }}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default AdminTopbar;
