import React from 'react';

const SellerFooter = () => (
  <footer className="mt-auto border-top small text-muted">
    <div className="container-fluid d-flex justify-content-between py-2">
      <div>© {new Date().getFullYear()} BachHoa Seller</div>
      <div><a href="/docs">Docs</a> · <a href="/support">Support</a></div>
    </div>
  </footer>
);

export default SellerFooter;
