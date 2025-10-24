import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useSellerOrdersCount } from '../../hooks/seller/useSellerOrders';

const Item = ({ to, label, badge, collapsed }) => (
  <Nav.Item>
    <Nav.Link as={NavLink} to={to} className="d-flex justify-content-between align-items-center" aria-current={({ isActive }) => isActive ? 'page' : undefined}>
      <span className={collapsed ? 'text-center w-100' : ''}>{label}</span>
      {badge > 0 && !collapsed && (<span className="badge rounded-pill text-bg-primary ms-2">{badge}</span>)}
    </Nav.Link>
  </Nav.Item>
);

const SellerSidebar = ({ collapsed, onToggle }) => {
  const { count: ordersCount } = useSellerOrdersCount();

  return (
    <aside className={`border-end bg-light ${collapsed ? 'seller-sidebar-collapsed' : ''}`} style={{ width: collapsed ? 64 : 220 }}>
      <div className="d-flex justify-content-between align-items-center px-2 py-2 border-bottom">
        <span className="small text-muted">Menu</span>
        <button className="btn btn-sm btn-outline-secondary" aria-label="Thu gọn" onClick={onToggle}>{collapsed ? '»' : '«'}</button>
      </div>
      <Nav className="flex-column p-2" variant="pills">
        <Item to="/seller" label="Dashboard" collapsed={collapsed} />
        <Item to="/seller/products" label="Sản phẩm" collapsed={collapsed} />
        <Item to="/seller/orders" label="Đơn hàng" badge={ordersCount} collapsed={collapsed} />
        <Item to="/seller/vouchers" label="Voucher" collapsed={collapsed} />
        <Item to="/seller/finance" label="Tài chính" collapsed={collapsed} />
        <Item to="/seller/profile" label="Cài đặt" collapsed={collapsed} />
      </Nav>
    </aside>
  );
};

export default SellerSidebar;
