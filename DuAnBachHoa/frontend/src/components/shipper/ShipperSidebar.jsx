import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const Item = ({ to, label }) => (
  <Nav.Item>
    <Nav.Link as={NavLink} to={to} aria-current={({ isActive }) => isActive ? 'page' : undefined}>{label}</Nav.Link>
  </Nav.Item>
);

const ShipperSidebar = () => {
  return (
    <aside className="border-end bg-light" style={{ width: 180 }}>
      <div className="p-2 border-bottom small text-muted">Menu</div>
      <Nav className="flex-column p-2" variant="pills">
        <Item to="/shipper" label="Dashboard" />
        <Item to="/shipper/new" label="Đơn mới" />
        <Item to="/shipper/active" label="Đang giao" />
        <Item to="/shipper/history" label="Lịch sử" />
        <Item to="/shipper/profile" label="Hồ sơ" />
      </Nav>
    </aside>
  );
};

export default ShipperSidebar;
