import React, { useEffect, useState } from 'react';
import { Offcanvas, Form, Button } from 'react-bootstrap';
import api from '../../services/api';

const SellerRightDrawer = () => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState(null); // 'product'
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const onOpen = (e) => {
      const detail = e.detail || {};
      setMode(detail.type);
      setId(detail.id);
      setShow(true);
    };
    window.addEventListener('seller:right-drawer', onOpen);
    return () => window.removeEventListener('seller:right-drawer', onOpen);
  }, []);

  useEffect(() => {
    if (show && mode === 'product' && id) {
      (async () => {
        try {
          setLoading(true);
          const res = await api.get(`/api/seller/products/${id}/`);
          setProduct(res.data);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [show, mode, id]);

  const onSave = async () => {
    if (!product) return;
    setLoading(true);
    try {
      await api.put(`/api/seller/products/${product.id}/`, {
        price: product.price,
        stock: product.stock,
        status: product.status,
        sale_price: product.sale_price,
      });
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Offcanvas show={show} onHide={() => setShow(false)} placement="end" backdrop>
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Chỉnh nhanh</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {mode === 'product' && product && (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Giá</Form.Label>
              <Form.Control type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tồn kho</Form.Label>
              <Form.Control type="number" value={product.stock} onChange={e => setProduct({ ...product, stock: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select value={product.status} onChange={e => setProduct({ ...product, status: e.target.value })}>
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Đang bán</option>
              </Form.Select>
            </Form.Group>
            <div className="d-grid">
              <Button disabled={loading} onClick={onSave} variant="primary">Lưu</Button>
            </div>
          </Form>
        )}
        {!product && loading && <div>Đang tải...</div>}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default SellerRightDrawer;
