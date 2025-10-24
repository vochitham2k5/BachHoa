import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerTopbar from '../components/seller/SellerTopbar';
import SellerSidebar from '../components/seller/SellerSidebar';
import SellerRightDrawer from '../components/seller/SellerRightDrawer';
import SellerFooter from '../components/seller/SellerFooter';
import ErrorBoundary from '../components/common/ErrorBoundary';
import useHotkeys from '../hooks/useHotkeys';

const SellerLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('seller_sidebar') === 'collapsed');
  const navigate = useNavigate();

  useHotkeys([
    { combo: ['g','p'], handler: () => navigate('/seller/products') },
    { combo: ['g','o'], handler: () => navigate('/seller/orders') },
    { combo: ['c','p'], handler: () => navigate('/seller/products#create') },
    { combo: ['/'], handler: () => {
      const el = document.getElementById('seller-global-search');
      if (el) el.focus();
    } },
  ]);

  useEffect(() => {
    localStorage.setItem('seller_sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  return (
    <ErrorBoundary>
      <div className="seller-layout d-flex flex-column min-vh-100">
        <SellerTopbar />
        <div className="seller-body d-flex" role="navigation" aria-label="Seller navigation">
          <SellerSidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
          <main className="flex-grow-1" role="main">
            <div className="container-fluid py-3">
              {/* Pages can render their own breadcrumbs/actions header at the top of their content */}
              {children}
            </div>
          </main>
        </div>
        <SellerRightDrawer />
        <SellerFooter />
      </div>
    </ErrorBoundary>
  );
};

export default SellerLayout;
