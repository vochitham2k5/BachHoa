import React, { useEffect, useMemo, useState } from 'react';
import { Button, Col, Container, Form, Row, Carousel } from 'react-bootstrap';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Home = () => {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [q, setQ] = useState('');
  const [products, setProducts] = useState([]);
  const { addItem } = useCart();
  const { show } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initialQ = params.get('q') || '';
    setQ(initialQ);
    fetchProducts(initialQ, params.get('sellerId'));
  }, [params]);

  const fetchProducts = async (query, sellerId) => {
    const res = await api.get('/buyer/products', { params: { q: query, sellerId } });
    setProducts(res.data || []);
  };

  return (
    <Container className="py-3">
      <Carousel className="mb-4 shadow-sm rounded" variant="dark">
        <Carousel.Item>
          <img className="d-block w-100" style={{ maxHeight: 260, objectFit: 'cover' }} src="https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?q=80&w=1400&auto=format&fit=crop" alt="Khuyến mãi 1" />
          <Carousel.Caption className="d-none d-md-block">
            <h5>Siêu ưu đãi cuối tuần</h5>
            <p>Giảm giá lên đến 50% cho nhiều mặt hàng thiết yếu</p>
          </Carousel.Caption>
        </Carousel.Item>
        <Carousel.Item>
          <img className="d-block w-100" style={{ maxHeight: 260, objectFit: 'cover' }} src="https://images.unsplash.com/photo-1506220926022-cc5c12acdb35?q=80&w=1400&auto=format&fit=crop" alt="Khuyến mãi 2" />
          <Carousel.Caption className="d-none d-md-block">
            <h5>Freeship nội thành</h5>
            <p>Áp dụng cho đơn từ 199.000 ₫</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
      <Row className="align-items-center mb-3 g-2">
        <Col md={8}>
          <Form.Control placeholder="Tìm kiếm sản phẩm..." value={q} onChange={e => setQ(e.target.value)} />
        </Col>
        <Col md="auto">
          <Button onClick={() => fetchProducts(q, params.get('sellerId'))}>Tìm kiếm</Button>
        </Col>
      </Row>
      <Row xs={2} md={4} lg={5} className="g-3">
        {products.map(p => (
          <Col key={p.id}><ProductCard product={p} onAdd={(prod) => {
            if (!user) { show('Vui lòng đăng nhập để thêm vào giỏ hàng', 'warning'); navigate('/login'); return; }
            try { addItem(prod, 1); show('Đã thêm vào giỏ'); }
            catch (e) { if (e?.code === 'LOGIN_REQUIRED') { navigate('/login'); } }
          }} /></Col>
        ))}
      </Row>
    </Container>
  );
};

export default Home;
