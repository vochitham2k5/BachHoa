import React, { useEffect, useRef, useState } from 'react';
import { Navbar, Container, Nav, Form, InputGroup, Button, Badge, Dropdown } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';

// ------------------------- SEARCH INPUT --------------------------
const SearchInput = () => {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const listRef = useRef(null);

  useEffect(() => {
    if (!debounced) {
      setItems([]);
      setOpen(false);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/api/products/', {
          params: { q: debounced, limit: 6, paged: 1, page: 1 },
        });
        if (!cancel) {
          setItems(res.data.items || res.data || []);
          setOpen(true);
        }
      } catch (e) {
        if (!cancel) setError('Tìm kiếm tạm thời lỗi');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [debounced]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!q) return;
    try {
      const recent = JSON.parse(localStorage.getItem('recent_searches') || '[]');
      const next = [q, ...recent.filter((x) => x !== q)].slice(0, 6);
      localStorage.setItem('recent_searches', JSON.stringify(next));
    } catch {}
    navigate(`/buyer/products?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  return (
    <div className="position-relative flex-grow-1" aria-label="Search">
      <Form onSubmit={onSubmit} role="search" aria-label="Tìm kiếm">
        <InputGroup>
          <Form.Control
            type="search"
            placeholder="Tìm sản phẩm, danh mục, cửa hàng..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Ô tìm kiếm"
          />
          <Button variant="primary" type="submit" aria-label="Thực hiện tìm kiếm">
            🔍
          </Button>
        </InputGroup>
      </Form>
      {open && (
        <div className="dropdown-menu show w-100 shadow-sm" ref={listRef} role="listbox" aria-label="Gợi ý tìm kiếm">
          {loading && <div className="dropdown-item text-muted">Đang tải...</div>}
          {error && <div className="dropdown-item text-danger">{error}</div>}
          {!loading &&
            !error &&
            items.slice(0, 6).map((p) => (
              <button
                key={p.id}
                className="dropdown-item text-truncate"
                onClick={() => {
                  navigate(`/buyer/products/${p.id}`);
                  setOpen(false);
                }}
              >
                {p.name}
              </button>
            ))}
          {!loading && !error && items.length === 0 && (
            <div className="dropdown-item text-muted">Không có kết quả</div>
          )}
        </div>
      )}
    </div>
  );
};

// ------------------------- CATEGORY MENU --------------------------
const CategoryMenu = () => {
  return (
    <Dropdown className="me-2" aria-label="Danh mục">
      <Dropdown.Toggle variant="outline-secondary" id="dropdown-categories" aria-expanded={false}>
        Danh mục
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item as={Link} to="/buyer/products?category=fruits">
          🍎 Trái cây
        </Dropdown.Item>
        <Dropdown.Item as={Link} to="/buyer/products?category=drinks">
          🥤 Đồ uống
        </Dropdown.Item>
        <Dropdown.Item as={Link} to="/buyer/products?category=snacks">
          🍪 Bánh kẹo
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

// ------------------------- LOCATION SELECTOR --------------------------
const LocationSelector = () => {
  const [city, setCity] = useState(() => localStorage.getItem('ship_city') || 'HCM');
  useEffect(() => {
    localStorage.setItem('ship_city', city);
  }, [city]);
  return (
    <Form.Select size="sm" value={city} onChange={(e) => setCity(e.target.value)} aria-label="Chọn khu vực giao hàng">
      <option value="HCM">TP.HCM</option>
      <option value="HN">Hà Nội</option>
      <option value="DN">Đà Nẵng</option>
    </Form.Select>
  );
};

// ------------------------- MAIN HEADER --------------------------
const BuyerHeader = () => {
  const { items } = useCart();
  const count = items.length;
  const { user, logout } = useAuth();

  const onCartClick = (e) => {
    e.preventDefault();
    const ev = new CustomEvent('cart:toggle');
    window.dispatchEvent(ev);
  };

  return (
    <header>
      <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm border-bottom py-2">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 text-success">
            🛒 Bách Hóa
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="buyer-navbar" />
          <Navbar.Collapse id="buyer-navbar">
            <Nav className="me-3">
              <Nav.Link as={Link} to="/" className="fw-semibold">
                🏠 Trang chủ
              </Nav.Link>
              <Nav.Link as={Link} to="/buyer/products" className="fw-semibold">
                🛍 Sản phẩm
              </Nav.Link>
              <Nav.Link as={Link} to="/cart" className="fw-semibold">
                🏭 Xe Hàng
              </Nav.Link>
              <Nav.Link as={Link} to="/buyer/wishlist" className="fw-semibold">
                💙 Yêu thích
              </Nav.Link>
            </Nav>

            <CategoryMenu />
            <SearchInput />

            <div className="d-flex align-items-center gap-2 ms-auto">
              <LocationSelector />
              <Nav.Link as={Link} to="/notifications" aria-label="Thông báo">
                🔔 <Badge bg="danger" pill>0</Badge>
              </Nav.Link>
              <Nav.Link onClick={onCartClick} aria-label="Giỏ hàng">
                🛒 <Badge bg="primary" pill>{count}</Badge>
              </Nav.Link>

              {!user && (
                <Nav className="align-items-center">
                  <Nav.Link as={Link} to="/login">Đăng nhập</Nav.Link>
                  <Button as={Link} to="/register" size="sm" variant="primary">
                    Đăng ký
                  </Button>
                </Nav>
              )}
              {user && (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-secondary" id="profile-menu" aria-label="Tài khoản">
                    {user.email}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/buyer/orders">Đơn hàng của tôi</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/profile">Tài khoản</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/seller/apply">Trở thành Seller</Dropdown.Item>
                    <Dropdown.Item as={Link} to="/shipper/apply">Trở thành Shipper</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={logout}>Đăng xuất</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div style={{ height: '70px' }}></div> {/* để tránh nội dung bị che bởi navbar fixed */}
    </header>
  );
};

export default BuyerHeader;
