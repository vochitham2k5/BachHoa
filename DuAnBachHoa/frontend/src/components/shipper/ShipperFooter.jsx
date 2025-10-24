import React from 'react';

const ShipperFooter = () => (
  <footer className="mt-auto border-top small text-muted">
    <div className="container-fluid d-flex justify-content-between py-2">
      <div>© {new Date().getFullYear()} BachHoa Shipper</div>
      <div><a href="/help">Help</a></div>
    </div>
  </footer>
);

export default ShipperFooter;
