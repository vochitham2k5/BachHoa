import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

const ProductList = () => {
  const [q, setQ] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [data, setData] = useState({ items: [], total: 0 });

  const fetchData = async (p = page) => {
    const res = await api.get('/api/products/', { params: { search: q, minPrice, maxPrice, inStock: inStock ? 1 : 0, page: p, limit, paged: 1 } });
    setData(res.data || { items: [], total: 0 });
    setPage(p);
  };

  useEffect(() => { fetchData(1); /*eslint-disable-next-line*/ }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / limit)), [data, limit]);

  return (
    <Container className="py-3">
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={3}><Form.Label>Từ khóa</Form.Label><Form.Control value={q} onChange={e => setQ(e.target.value)} placeholder="Tên sản phẩm" /></Col>
            <Col md={2}><Form.Label>Giá từ</Form.Label><Form.Control type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} /></Col>
            <Col md={2}><Form.Label>Đến</Form.Label><Form.Control type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} /></Col>
            <Col md={2}><Form.Check type="checkbox" label="Còn hàng" checked={inStock} onChange={e => setInStock(e.target.checked)} /></Col>
            <Col md="auto"><Button onClick={() => fetchData(1)}>Lọc</Button></Col>
          </Row>
        </Card.Body>
      </Card>

      <Row xs={2} md={4} lg={5} className="g-3">
        {data.items.map(p => (
          <Col key={p.id}><ProductCard product={p} /></Col>
        ))}
      </Row>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div><Badge bg="secondary">{data.total} sản phẩm</Badge></div>
        <div className="d-flex align-items-center gap-2">
          <Button size="sm" disabled={page <= 1} onClick={() => fetchData(page - 1)}>Trước</Button>
          <span>Trang {page}/{totalPages}</span>
          <Button size="sm" disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>Sau</Button>
        </div>
      </div>
    </Container>
  );
};

export default ProductList;
