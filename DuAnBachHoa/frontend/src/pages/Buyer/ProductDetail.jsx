import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Col, Container, Form, Image, InputGroup, Row } from 'react-bootstrap';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { addItem } = useCart();
  const { show } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const res = await api.get(`/buyer/products/${id}`);
      setProduct(res.data);
    })();
  }, [id]);

  if (!product) return null;

  return (
    <Container className="py-3">
      <Row className="g-4">
        <Col md={5}>
          {product.images?.[0] && <Image src={product.images[0]} thumbnail />}
        </Col>
        <Col md={7}>
          <h3>{product.name}</h3>
          <div className="fs-4 text-danger">{(product.sale_price ?? product.price).toLocaleString()} ₫</div>
          {product.sale_price && <small className="text-muted text-decoration-line-through">{product.price.toLocaleString()} ₫</small>}
          <div className="mt-3"><Badge bg={product.stock > 0 ? 'success' : 'secondary'}>{product.stock > 0 ? 'Còn hàng' : 'Hết hàng'}</Badge></div>
          <p className="mt-3">{product.description}</p>

          {/* Chọn số lượng + hành động */}
          <div className="d-flex align-items-center gap-2 mt-3">
            <InputGroup style={{ maxWidth: 160 }}>
              <Button variant="outline-secondary" onClick={() => setQty(q => Math.max(1, q - 1))}>-</Button>
              <Form.Control type="number" min={1} max={Math.max(1, product.stock)} value={qty}
                onChange={(e)=> setQty(Math.max(1, Math.min(product.stock || 9999, parseInt(e.target.value || '1', 10))))} />
              <Button variant="outline-secondary" onClick={() => setQty(q => Math.min((product.stock||9999), q + 1))}>+</Button>
            </InputGroup>
            <Button
              disabled={product.stock <= 0}
              onClick={() => {
                if (!user) { show('Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning'); navigate('/login'); return; }
                try { addItem(product, qty); show('Đã thêm vào giỏ'); window.dispatchEvent(new CustomEvent('cart:toggle')); }
                catch (e) { if (e?.code === 'LOGIN_REQUIRED') navigate('/login'); }
              }}
            >Thêm vào giỏ</Button>
            <Button
              variant="primary"
              disabled={product.stock <= 0}
              onClick={() => {
                if (!user) { show('Vui lòng đăng nhập để mua hàng', 'warning'); navigate('/login'); return; }
                try { addItem(product, qty); navigate('/checkout'); }
                catch (e) { if (e?.code === 'LOGIN_REQUIRED') navigate('/login'); }
              }}
            >Mua ngay</Button>
          </div>
        </Col>
      </Row>

      {/* Đánh giá sản phẩm */}
      <Row className="g-4 mt-4">
        <Col md={12}>
          <h5>Đánh giá sản phẩm</h5>
          {!user ? (
            <div className="text-muted">Bạn cần <Link to="/login">đăng nhập</Link> để đánh giá.</div>
          ) : (
            <Form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post('/api/reviews/', { product: Number(id), rating, title, body, anonymous: false });
                show('Cảm ơn bạn đã đánh giá');
                setTitle(''); setBody(''); setRating(5);
              } catch (err) {
                const msg = err?.response?.data?.detail || 'Không thể gửi đánh giá (cần đơn đã giao)';
                show(msg, 'danger');
              }
            }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="me-2">Chọn điểm:</span>
                {[1,2,3,4,5].map(n => (
                  <Button key={n} type="button" variant={n <= rating ? 'warning' : 'outline-secondary'} size="sm" onClick={()=>setRating(n)}>★</Button>
                ))}
                <span className="ms-2">{rating}/5</span>
              </div>
              <Form.Control className="mb-2" placeholder="Tiêu đề (tuỳ chọn)" value={title} onChange={e=>setTitle(e.target.value)} />
              <Form.Control as="textarea" rows={3} placeholder="Viết cảm nhận của bạn..." value={body} onChange={e=>setBody(e.target.value)} />
              <div className="mt-2"><Button type="submit">Gửi đánh giá</Button></div>
            </Form>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetail;
