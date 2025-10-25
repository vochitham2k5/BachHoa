import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Badge, Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const Stat = ({ label, value, sub }) => (
  <div className="text-center">
    <div className="small text-muted">{label}</div>
    <div className="fw-semibold">{value}</div>
    {sub && <div className="small text-muted">{sub}</div>}
  </div>
);

const ShopPage = () => {
  const { sellerId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shop, setShop] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);
  const qParam = searchParams.get('q') || '';
  const [q, setQ] = useState(qParam);
  const { addItem } = useCart();
  const { user } = useAuth();
  const { show } = useToast();

  const limit = 24;
  const page = Number(searchParams.get('page') || '1');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/shop/${sellerId}/`);
        setShop(res.data);
        setLoadError('');
      } catch (e) {
        setLoadError('Không tải được thông tin shop.');
        // Fallback để trang không bị treo vô hạn
        setShop({ id: Number(sellerId), shopName: 'Shop', rating: 0, ratingCount: 0, productCount: 0, followers: 0, isFollowing: false });
      }
    })();
  }, [sellerId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/buyer/products', { params: { sellerId, q: qParam, paged: 1, page, limit } });
        const data = res.data.items ? res.data : { items: res.data, total: res.data?.length || 0 };
        setProducts(data.items || []);
        setTotal(data.total || 0);
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId, qParam, page]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  if (!shop) return <Container className="py-4"><div>Đang tải shop...</div></Container>;

  return (
    <Container className="py-3">
      {/* Shop header */}
      <Card className="shadow-sm mb-3">
        <Card.Body>
          {loadError && (
            <div className="alert alert-warning py-2">{loadError} Vui lòng thử lại sau khi khởi động backend hoặc chạy migrate.</div>
          )}
          <Row className="g-3 align-items-center">
            <Col md={6} className="d-flex align-items-center gap-3">
              <img src="https://via.placeholder.com/64" alt="Shop" width={64} height={64} className="rounded-circle" />
              <div>
                <div className="h5 mb-1">{shop.shopName}</div>
                <div className="text-muted small">{shop.lastOnlineAt ? 'Online gần đây' : 'Online ẩn'} · Tham gia: {shop.joinedAt ? new Date(shop.joinedAt).toLocaleDateString() : '-'}</div>
              </div>
            </Col>
            <Col md={6} className="d-flex justify-content-md-end gap-2">
              <Button
                variant={shop?.isFollowing ? 'secondary' : 'outline-secondary'}
                disabled={!user || busyFollow}
                onClick={async ()=>{
                  if (!user) { show('Vui lòng đăng nhập để theo dõi', 'warning'); return; }
                  setBusyFollow(true);
                  try {
                    const res = await api.post(`/api/shop/${sellerId}/follow`);
                    setShop(s => ({...s, isFollowing: res.data.following, followers: res.data.followers }));
                  } catch (e) {
                    const msg = e?.response?.data?.detail || 'Không thực hiện được theo dõi (cần chạy migrate backend?)';
                    show(msg, 'danger');
                  } finally {
                    setBusyFollow(false);
                  }
                }}
              >{shop?.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}{shop?.followers ? ` (${shop.followers})` : ''}</Button>
              <Button as={Link} to={`/chat/${sellerId}`} variant="outline-danger" disabled={!user}>Chat</Button>
            </Col>
          </Row>
          <Row className="g-2 text-center mt-3">
            <Col xs={6} md={2}><Stat label="Sản phẩm" value={shop.productCount || 0} /></Col>
            <Col xs={6} md={2}><Stat label="Người theo dõi" value={(shop.followers || 0).toLocaleString()} /></Col>
            <Col xs={6} md={2}><Stat label="Đang theo" value={(shop.following || 0).toLocaleString()} /></Col>
            <Col xs={6} md={3}><Stat label="Đánh giá" value={(shop.rating || 0).toFixed(1)} sub={`${shop.ratingCount || 0} đánh giá`} /></Col>
            <Col xs={6} md={3}><Stat label="Tỉ lệ phản hồi Chat" value={`${Math.round((shop.chatResponseRate ?? 1) * 100)}%`} sub={shop.chatResponseSla || 'Trong vài phút'} /></Col>
          </Row>

          {!user && (
            <div className="alert alert-info py-2 mb-3">
              Shopping Cart · Vui lòng đăng nhập để xem giỏ hàng / thêm sản phẩm vào giỏ
            </div>
          )}
          <div className="mt-3">
            <Form
              onSubmit={(e)=>{ e.preventDefault(); const next = new URLSearchParams(searchParams); if (q) next.set('q', q); else next.delete('q'); next.set('page','1'); setSearchParams(next); }}
            >
              <InputGroup>
                <Form.Control placeholder="Tìm trong Shop này" value={q} onChange={(e)=>setQ(e.target.value)} />
                <Button type="submit" variant="primary">Tìm</Button>
              </InputGroup>
            </Form>
          </div>
        </Card.Body>
      </Card>

      {/* Products (Dạo) */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">Dạo</h5>
        {qParam && <Badge bg="secondary">Từ khóa: "{qParam}"</Badge>}
      </div>
      {loading ? (
        <div>Đang tải sản phẩm...</div>
      ) : (
        <Row className="g-3">
          {products.map(p => (
            <Col key={p.id} xs={6} md={3} lg={2}>
              <ProductCard product={p} onAdd={(product)=>{
                try { if (!user) throw Object.assign(new Error('LOGIN_REQUIRED'), { code: 'LOGIN_REQUIRED' }); addItem(product, 1); show('Đã thêm vào giỏ'); }
                catch (e) { if (e?.code === 'LOGIN_REQUIRED') { show('Vui lòng đăng nhập để thêm vào giỏ', 'warning'); } }
              }} />
            </Col>
          ))}
          {products.length === 0 && (
            <div className="text-muted">Chưa có sản phẩm phù hợp.</div>
          )}
        </Row>
      )}

      {/* Simple pagination */}
      {pages > 1 && (
        <div className="d-flex justify-content-center mt-3 gap-2">
          <Button size="sm" variant="outline-secondary" disabled={page <= 1} onClick={()=>{ const next = new URLSearchParams(searchParams); next.set('page', String(page - 1)); setSearchParams(next); }}>Trang trước</Button>
          <div className="small align-self-center">Trang {page}/{pages}</div>
          <Button size="sm" variant="outline-secondary" disabled={page >= pages} onClick={()=>{ const next = new URLSearchParams(searchParams); next.set('page', String(page + 1)); setSearchParams(next); }}>Trang sau</Button>
        </div>
      )}
    </Container>
  );
};

export default ShopPage;
