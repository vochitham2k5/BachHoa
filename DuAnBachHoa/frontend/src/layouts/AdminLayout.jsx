import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import AdminTopbar from '../components/admin/AdminTopbar';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminRightPanel from '../components/admin/AdminRightPanel';
import AdminFooter from '../components/admin/AdminFooter';
import { AdminUIProvider } from '../contexts/AdminUIContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin.sidebarOpen') ?? 'true'); } catch { return true; }
  });
  const [rightOpen, setRightOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin.rightOpen') ?? 'false'); } catch { return false; }
  });
  const searchRef = useRef(null);

  // Ctrl+K focuses global search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (searchRef.current) {
          searchRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const sidebarCol = useMemo(() => (sidebarOpen ? 2 : 0), [sidebarOpen]);
  const rightCol = useMemo(() => (rightOpen ? 3 : 0), [rightOpen]);
  const mainCol = useMemo(() => 12 - sidebarCol - rightCol, [sidebarCol, rightCol]);

  const toggleSidebar = () => setSidebarOpen((s) => { const ns = !s; localStorage.setItem('admin.sidebarOpen', JSON.stringify(ns)); return ns; });
  const toggleRight = () => setRightOpen((s) => { const ns = !s; localStorage.setItem('admin.rightOpen', JSON.stringify(ns)); return ns; });

  return (
    <AdminUIProvider>
      <div className="bg-light min-vh-100 d-flex flex-column">
        <AdminTopbar
          onToggleSidebar={toggleSidebar}
          onToggleRight={toggleRight}
          searchRef={searchRef}
        />
        <Container fluid className="flex-grow-1">
          <Row>
            {sidebarOpen && (
              <Col md={2} lg={2} className="border-end p-0 d-none d-md-block bg-white">
                <AdminSidebar />
              </Col>
            )}
            <Col md={mainCol} className="p-3">
              {children}
            </Col>
            {rightOpen && (
              <Col md={3} lg={3} className="border-start p-0 d-none d-md-block bg-white">
                <AdminRightPanel />
              </Col>
            )}
          </Row>
        </Container>
        <AdminFooter />
      </div>
    </AdminUIProvider>
  );
};

export default AdminLayout;
