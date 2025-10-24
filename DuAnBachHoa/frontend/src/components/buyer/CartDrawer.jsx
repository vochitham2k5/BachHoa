import React, { useEffect, useState } from 'react';
import { Offcanvas, Button, ListGroup, Form } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const CartDrawer = () => {
  const [show, setShow] = useState(false);
  const { items, removeItem, updateQty, total } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onToggle = () => setShow(prev => !prev);
    window.addEventListener('cart:toggle', onToggle);
    return () => window.removeEventListener('cart:toggle', onToggle);
  }, []);

  const goCheckout = () => {
    setShow(false);
    navigate('/checkout');
  };

  return (
    <Offcanvas show={show} onHide={() => setShow(false)} placement="end" aria-labelledby="cart-drawer-title">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="cart-drawer-title">Giỏ hàng</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {items.length === 0 && <div className="text-center text-muted">Giỏ hàng trống</div>}
        <ListGroup variant="flush">
          {items.map(it => (
            <ListGroup.Item key={it.id} className="d-flex align-items-center justify-content-between gap-2">
              <div className="flex-grow-1">
                <div className="fw-semibold text-truncate"><Link to={`/buyer/products/${it.id}`}>{it.name}</Link></div>
                <div className="small text-muted">{it.price.toLocaleString()} đ</div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <Form.Control size="sm" type="number" min={1} value={it.qty} onChange={e => updateQty(it.id, parseInt(e.target.value || 1, 10))} aria-label="Số lượng" style={{ maxWidth: 80 }} />
                  <Button variant="link" size="sm" onClick={() => removeItem(it.id)} aria-label="Xóa khỏi giỏ">Xóa</Button>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="fw-semibold">Tạm tính:</div>
          <div className="fs-5 text-primary">{total.toLocaleString()} đ</div>
        </div>
        <div className="d-grid mt-3">
          <Button variant="primary" disabled={items.length === 0} onClick={goCheckout}>Thanh toán</Button>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CartDrawer;
