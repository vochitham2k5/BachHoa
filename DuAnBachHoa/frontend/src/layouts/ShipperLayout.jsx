import React, { useState } from 'react';
import ShipperTopbar from '../components/shipper/ShipperTopbar';
import ShipperSidebar from '../components/shipper/ShipperSidebar';
import ShipperFooter from '../components/shipper/ShipperFooter';
import ShipperBottomBar from '../components/shipper/ShipperBottomBar';
import ErrorBoundary from '../components/common/ErrorBoundary';

const ShipperLayout = ({ children }) => {
  const [showMap, setShowMap] = useState(false);

  return (
    <ErrorBoundary>
      <div className="shipper-layout d-flex flex-column min-vh-100">
        <ShipperTopbar onToggleMap={() => setShowMap(v => !v)} showMap={showMap} />
        <div className="d-flex flex-grow-1">
          <ShipperSidebar />
          <main className="flex-grow-1" role="main">
            {showMap && (
              <div className="border-bottom bg-light p-2">Bản đồ (đang phát triển)</div>
            )}
            <div className="container-fluid py-3">
              {children}
            </div>
          </main>
        </div>
        <ShipperBottomBar />
        <ShipperFooter />
      </div>
    </ErrorBoundary>
  );
};

export default ShipperLayout;
