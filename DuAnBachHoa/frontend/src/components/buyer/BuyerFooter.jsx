import React from 'react';

const BuyerFooter = () => {
  return (
    <footer className="mt-auto bg-light border-top" role="contentinfo">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <h6 className="fw-bold">BachHoa</h6>
            <p className="text-muted small">Siêu thị trực tuyến - Giao nhanh, giá tốt.</p>
          </div>
          <div className="col-6 col-md-4">
            <h6 className="fw-bold">Hỗ trợ khách hàng</h6>
            <ul className="list-unstyled small">
              <li><a href="/help/faq">FAQ</a></li>
              <li><a href="/help/contact">Liên hệ</a></li>
              <li><a href="/help/returns">Chính sách đổi trả</a></li>
            </ul>
          </div>
          <div className="col-6 col-md-4">
            <h6 className="fw-bold">Liên kết nhanh</h6>
            <ul className="list-unstyled small">
              <li><a href="/buyer/products?category=fruits">Trái cây</a></li>
              <li><a href="/buyer/products?category=drinks">Đồ uống</a></li>
              <li><a href="/buyer/products?category=snacks">Bánh kẹo</a></li>
            </ul>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center pt-3 mt-3 border-top small text-muted">
          <div>© {new Date().getFullYear()} BachHoa. All rights reserved.</div>
          <div>VNPay • Momo • Card</div>
        </div>
      </div>
    </footer>
  );
};

export default BuyerFooter;
