import React from 'react';
import BuyerHeader from '../components/buyer/BuyerHeader';
import BuyerFooter from '../components/buyer/BuyerFooter';
import CartDrawer from '../components/buyer/CartDrawer';
import SkipLink from '../components/common/SkipLink';
import ErrorBoundary from '../components/common/ErrorBoundary';

const BuyerLayout = ({ children, sidebar = null, secondaryNav = null }) => {
  return (
    <ErrorBoundary>
      <div id="top" />
      <SkipLink href="#main" label="Bỏ qua điều hướng" />
      <div className="buyer-layout d-flex flex-column min-vh-100">
        <div className="top-header text-white bg-dark small py-1">
          <div className="container d-flex justify-content-between">
            <div>Hotline: 1900 1234</div>
            <div>Khuyến mãi: Miễn phí ship đơn từ 300k</div>
          </div>
        </div>
        <BuyerHeader />
        {secondaryNav}
        <main id="main" className="flex-grow-1" role="main">
          <div className="container my-3">
            <div className="row g-3">
              {sidebar && (
                <aside className="col-12 col-md-3" aria-label="Bộ lọc">
                  {sidebar}
                </aside>
              )}
              <section className={sidebar ? 'col-12 col-md-9' : 'col-12'}>
                {children}
              </section>
            </div>
          </div>
        </main>
        <BuyerFooter />
        <CartDrawer />
      </div>
    </ErrorBoundary>
  );
};

export default BuyerLayout;
