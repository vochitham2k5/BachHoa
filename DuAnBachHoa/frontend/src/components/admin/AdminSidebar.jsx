import React, { useEffect, useState } from 'react';
import { Badge, Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { onAdminEvent } from '../../contexts/AdminBus';

const AdminSidebar = () => {
  const { pathname } = useLocation();

  const [counts, setCounts] = useState({ pendingApps: 0, flags: 0 });
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [appsRes, flagsRes] = await Promise.all([
          api.get('/api/admin/applications/', { params: { status: 'PENDING' } }),
          api.get('/api/admin/products/flags/'),
        ]);
        setCounts({ pendingApps: (appsRes.data || []).length, flags: (flagsRes.data || []).length });
      } catch (_) {
        setCounts({ pendingApps: 0, flags: 0 });
      }
    };
    fetchCounts();
    const off = onAdminEvent('admin:refreshCounts', fetchCounts);
    return () => off();
  }, []);

  const items = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/applications', label: 'Applications', badge: counts.pendingApps },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/products', label: 'Products', badge: counts.flags },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/audit-logs', label: 'Audit Logs' },
    { to: '/admin/settings', label: 'Settings' },
  ];

  return (
    <nav aria-label="Admin sidebar">
      <Nav className="flex-column p-2">
        {items.map((item) => (
          <Nav.Link
            key={item.to}
            as={Link}
            to={item.to}
            active={pathname === item.to}
            className="text-truncate"
          >
            <span>{item.label}</span>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <Badge bg="secondary" pill className="ms-2">{item.badge}</Badge>
            )}
          </Nav.Link>
        ))}
      </Nav>
    </nav>
  );
};

export default AdminSidebar;
