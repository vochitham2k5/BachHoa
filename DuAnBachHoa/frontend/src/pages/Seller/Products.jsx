import React, { useEffect, useState, useCallback } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import api from '../../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: '', price: 0, stock: 0, sku: '', status: 'DRAFT' });
  const [filters, setFilters] = useState({ q: '', status: '', lowStock: false, category: '' });
  const [csvText, setCsvText] = useState('');

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.status) params.append('status', filters.status);
    if (filters.lowStock) params.append('lowStock', '1');
    if (filters.category) params.append('category', filters.category);
    params.append('paged', '1');
    params.append('limit', '100');
    const res = await api.get(`/api/seller/products/?${params.toString()}`);
    setProducts(res.data?.items || res.data || []);
  }, [filters.q, filters.status, filters.lowStock, filters.category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onCreate = async () => {
    await api.post('/api/seller/products/', form);
    setShow(false);
    setForm({ name: '', price: 0, stock: 0, sku: '', status: 'DRAFT' });
    fetchProducts();
  };

  const onDelete = async (id) => { await api.delete(`/api/seller/products/${id}/`); fetchProducts(); };
  const onPublish = async (p) => { await api.put(`/api/seller/products/${p.id}/`, { status: p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }); fetchProducts(); };
  const onImportCsv = async () => { if (!csvText.trim()) return; await api.post('/api/seller/products/import/', { csv: csvText }); setCsvText(''); fetchProducts(); };

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Danh sách sản phẩm</h5>
        <div>
          <Button className="me-2" variant="outline-secondary" onClick={() => setShow(true)}>Thêm sản phẩm</Button>
        </div>
      </div>

      <Card className="shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2 align-items-end">
            <Col md={4}><Form.Control placeholder="Tìm theo tên..." value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} /></Col>
            <Col md={3}><Form.Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}><option value="">Tất cả trạng thái</option><option value="DRAFT">Nháp</option><option value="PUBLISHED">Đã xuất bản</option></Form.Select></Col>
            <Col md={3}><Form.Control placeholder="Danh mục" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} /></Col>
            <Col md={2}><Form.Check type="switch" id="lowStock" label="Sắp hết hàng" checked={filters.lowStock} onChange={e => setFilters(f => ({ ...f, lowStock: e.target.checked }))} /></Col>
          </Row>
          <div className="mt-2 d-flex justify-content-end"><Button size="sm" onClick={fetchProducts}>Lọc</Button></div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Tổng: {products.length}</div>
            <div className="d-flex" style={{gap:8}}>
              <Form.Control as="textarea" rows={1} placeholder="Dán CSV: name,sku,price,stock,status" value={csvText} onChange={e => setCsvText(e.target.value)} style={{width: 320}} />
              <Button size="sm" variant="outline-primary" onClick={onImportCsv}>Nhập CSV</Button>
            </div>
          </div>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Tên</th>
                <th>SKU</th>
                <th>Giá</th>
                <th>Tồn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td className="fw-bold">{p.name}</td>
                  <td>{p.sku || '-'}</td>
                  <td>{(p.sale_price ?? p.price)?.toLocaleString()} ₫</td>
                  <td>{p.stock}</td>
                  <td><Badge bg={p.status === 'PUBLISHED' ? 'success' : 'secondary'}>{p.status}</Badge></td>
                  <td>
                    <Button size="sm" className="me-1" variant={p.status === 'PUBLISHED' ? 'outline-warning' : 'outline-success'} onClick={() => onPublish(p)}>{p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(p.id)}>Xóa</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton><Modal.Title>Thêm sản phẩm</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>SKU</Form.Label>
              <Form.Control value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Giá</Form.Label>
              <Form.Control type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tồn kho</Form.Label>
              <Form.Control type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Xuất bản</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Hủy</Button>
          <Button onClick={onCreate}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Products;
