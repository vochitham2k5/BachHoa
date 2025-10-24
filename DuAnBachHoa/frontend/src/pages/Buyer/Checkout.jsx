import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row } from 'react-bootstrap';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';

const Checkout = () => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState('');
  const [newAddress, setNewAddress] = useState({ label: '', recipient_name: '', phone: '', street: '', ward: '', district: '', city: '' });
  const [step, setStep] = useState(1);
  const [showPriceChange, setShowPriceChange] = useState(false);
  const [serverTotal, setServerTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const { items, clearCart, total } = useCart();
  const [sellerId, setSellerId] = useState('');
  const { show } = useToast();

  const uniqueSellers = useMemo(() => Array.from(new Set(items.map(i => i.sellerId).filter(Boolean))), [items]);
  const canSubmit = items.length > 0 && (uniqueSellers.length === 1 || sellerId);

  useEffect(() => { (async () => { try { const res = await api.get('/api/addresses/'); setAddresses(res.data || []); } catch {} })(); }, []);

  const validateCart = async () => {
    const res = await api.post('/api/cart/', { items: items.map(it => ({ productId: it.id, qty: it.qty })) });
    const sum = (res.data.items || []).reduce((s, x) => s + x.lineTotal, 0);
    setServerTotal(sum);
    if (Math.round(sum) !== Math.round(total)) setShowPriceChange(true);
  };

  const placeOrder = async () => {
    if (!canSubmit) return;
    await validateCart();
    const payload = {
      sellerId: sellerId || uniqueSellers[0],
      items: items.map(it => ({ productId: it.id, qty: it.qty })),
      address: selectedAddrId ? { addressId: selectedAddrId } : newAddress,
      paymentMethod
    };
  await api.post('/api/orders/', payload, { headers: { 'Idempotency-Key': `order-${Date.now()}` } });
    show('Đặt hàng thành công');
    clearCart();
    // optionally navigate to orders page
  };

  return (
    <Container className="py-3">
      <Row>
        <Col md={8}>
          {step === 1 && (
            <Card className="shadow-sm mb-3"><Card.Body>
              <Card.Title>Địa chỉ giao hàng</Card.Title>
              <div className="mb-2">
                <Form.Select value={selectedAddrId} onChange={e => setSelectedAddrId(e.target.value)}>
                  <option value="">-- Chọn địa chỉ đã lưu --</option>
                  {addresses.map(a => (<option key={a.id} value={a.id}>{a.label || a.recipient_name} - {a.street}, {a.district}, {a.city}</option>))}
                </Form.Select>
              </div>
              <div className="text-muted small mb-2">Hoặc nhập địa chỉ mới:</div>
              <Row>
                <Col md={6}><Form.Control placeholder="Người nhận" value={newAddress.recipient_name} onChange={e => setNewAddress(a => ({ ...a, recipient_name: e.target.value }))} className="mb-2" /></Col>
                <Col md={6}><Form.Control placeholder="Điện thoại" value={newAddress.phone} onChange={e => setNewAddress(a => ({ ...a, phone: e.target.value }))} className="mb-2" /></Col>
                <Col md={12}><Form.Control placeholder="Số nhà, đường" value={newAddress.street} onChange={e => setNewAddress(a => ({ ...a, street: e.target.value }))} className="mb-2" /></Col>
                <Col md={4}><Form.Control placeholder="Phường/Xã" value={newAddress.ward} onChange={e => setNewAddress(a => ({ ...a, ward: e.target.value }))} className="mb-2" /></Col>
                <Col md={4}><Form.Control placeholder="Quận/Huyện" value={newAddress.district} onChange={e => setNewAddress(a => ({ ...a, district: e.target.value }))} className="mb-2" /></Col>
                <Col md={4}><Form.Control placeholder="Tỉnh/Thành" value={newAddress.city} onChange={e => setNewAddress(a => ({ ...a, city: e.target.value }))} className="mb-2" /></Col>
              </Row>
              <div className="d-flex justify-content-end"><Button onClick={() => setStep(2)}>Tiếp tục</Button></div>
            </Card.Body></Card>
          )}
          {step === 2 && (
            <Card className="shadow-sm mb-3"><Card.Body>
              <Card.Title>Phương thức thanh toán</Card.Title>
              <Form.Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="COD">COD</option>
                <option value="MOMO">Momo</option>
                <option value="ZALOPAY">ZaloPay</option>
                <option value="VNPAY">VNPay</option>
              </Form.Select>
              <div className="d-flex justify-content-between mt-3">
                <Button variant="secondary" onClick={() => setStep(1)}>Quay lại</Button>
                <Button onClick={() => setStep(3)}>Tiếp tục</Button>
              </div>
            </Card.Body></Card>
          )}
          {step === 3 && (
            <Card className="shadow-sm mb-3"><Card.Body>
              <Card.Title>Xác nhận đơn hàng</Card.Title>
              <div className="text-muted">Kiểm tra thông tin và đặt hàng.</div>
              <div className="d-flex justify-content-between mt-3">
                <Button variant="secondary" onClick={() => setStep(2)}>Quay lại</Button>
                <Button onClick={placeOrder} disabled={!canSubmit}>Đặt hàng</Button>
              </div>
            </Card.Body></Card>
          )}
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              {uniqueSellers.length > 1 && (
                <>
                  <div className="mb-2 small text-muted">Giỏ hàng có nhiều người bán, chọn Seller ID để tạo đơn</div>
                  <Form.Control placeholder="Seller ID" value={sellerId} onChange={e => setSellerId(e.target.value)} className="mb-3" />
                </>
              )}
              <Form.Control placeholder="Mã giảm giá" className="mb-2" />
              <div className="d-flex justify-content-between"><span>Tổng</span><strong>{total.toLocaleString()} ₫</strong></div>
              <div className="small text-muted">Tổng hệ thống: {serverTotal ? serverTotal.toLocaleString() : total.toLocaleString()} ₫</div>
              <Button className="w-100 mt-2" onClick={() => setStep(3)} disabled={items.length===0}>Tiếp tục</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showPriceChange} onHide={() => setShowPriceChange(false)}>
        <Modal.Header closeButton><Modal.Title>Giá đã thay đổi</Modal.Title></Modal.Header>
        <Modal.Body>Giá sản phẩm có thay đổi so với lúc thêm vào giỏ. Vui lòng kiểm tra lại tổng tiền.</Modal.Body>
        <Modal.Footer><Button onClick={() => setShowPriceChange(false)}>Đã hiểu</Button></Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Checkout;
