import React from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { items, updateQty, removeItem, total } = useCart();
  const navigate = useNavigate();

  return (
    <Container className="py-3">
      <Row>
        <Col md={8}>
          {items.length === 0 ? (
            <Card className="shadow-sm"><Card.Body>Giỏ hàng trống.</Card.Body></Card>
          ) : (
            items.map(it => (
              <Card className="shadow-sm mb-2" key={it.id}>
                <Card.Body className="d-flex align-items-center justify-content-between">
                  <div>{it.name}</div>
                  <Form.Control style={{ width: 80 }} type="number" value={it.qty} min={1} onChange={e => updateQty(it.id, Number(e.target.value))} />
                  <div>{(it.price * it.qty).toLocaleString()} ₫</div>
                  <Button variant="outline-danger" size="sm" onClick={() => removeItem(it.id)}>Xóa</Button>
                </Card.Body>
              </Card>
            ))
          )}
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between"><span>Tổng tiền</span><strong>{total.toLocaleString()} ₫</strong></div>
              <Button className="w-100 mt-3" disabled={items.length === 0} onClick={() => navigate('/checkout')}>Thanh toán</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;
