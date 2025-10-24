import React, { useEffect, useState, useCallback } from 'react';
import { Badge, Button, Card, Container, Form, InputGroup, Modal, Row, Col, Table } from 'react-bootstrap';
import api from '../../services/api';
import { useAdminUI } from '../../contexts/AdminUIContext';

const Orders = () => {
  const { setTitle, setActions } = useAdminUI();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [status, setStatus] = useState('');
  const [refundModal, setRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');

  const fetchOrders = useCallback(async () => {
    const res = await api.get('/api/admin/orders/', { params: { q: q || undefined } });
    setItems(res.data || []);
  }, [q]);
  useEffect(() => {
    setTitle('Orders');
    fetchOrders();
    setActions(<Button size="sm" variant="outline-secondary" onClick={fetchOrders}>Refresh</Button>);
    return () => setActions(null);
  // include setActions to satisfy exhaustive-deps; it's stable from context
  }, [setTitle, fetchOrders, setActions]);
  useEffect(() => { if (!selected) return; (async ()=>{ const res = await api.get(`/api/admin/orders/${selected}/`); setDetail(res.data); setStatus(res.data?.status || ''); })(); }, [selected]);

  const updateStatus = async () => { await api.put(`/api/admin/orders/${selected}/status/`, { status, reason: 'Admin override' }); await fetchOrders(); setSelected(null); };
  const doRefund = async () => {
    try {
      await api.post(`/api/admin/orders/${selected}/refund/`, { amount: parseFloat(refundAmount), note: refundNote });
      setRefundModal(false);
    } catch (e) {
      alert(e?.response?.data?.detail || 'Refund failed');
    }
  };

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Card.Title className="mb-0">Tất cả đơn hàng</Card.Title>
        <InputGroup style={{ maxWidth: 320 }}>
          <Form.Control placeholder="Tìm kiếm (#id, seller)" value={q} onChange={(e)=>setQ(e.target.value)} />
          <Button variant="outline-secondary" onClick={fetchOrders}>Tìm</Button>
        </InputGroup>
      </div>
      <Card className="shadow-sm">
        <Card.Body>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Trạng thái</th>
                <th>Tổng</th>
                <th>Thời gian</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td><Badge bg="secondary">{o.status}</Badge></td>
                  <td>{o.total?.toLocaleString()} ₫</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td className="text-end"><Button size="sm" onClick={()=>setSelected(o.id)}>Chi tiết</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!selected} onHide={()=>setSelected(null)} size="lg" centered>
        <Modal.Header closeButton><Modal.Title>Đơn hàng #{selected}</Modal.Title></Modal.Header>
        <Modal.Body>
          {detail ? (
            <Row>
              <Col md={6}>
                <h6>Thông tin</h6>
                <div className="mb-2">Trạng thái hiện tại: <Badge bg="info">{detail.status}</Badge></div>
                <Form.Group className="mb-2">
                  <Form.Label>Cập nhật trạng thái</Form.Label>
                  <Form.Select value={status} onChange={(e)=>setStatus(e.target.value)}>
                    <option value="">Chọn...</option>
                    <option>CONFIRMED</option>
                    <option>PACKED</option>
                    <option>SHIPPED</option>
                    <option>DELIVERED</option>
                    <option>CANCELLED</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button disabled={!status} onClick={updateStatus}>Cập nhật</Button>
                  <Button variant="outline-danger" onClick={()=>setRefundModal(true)}>Hoàn tiền</Button>
                </div>
              </Col>
              <Col md={6}>
                <h6>Tóm tắt</h6>
                <pre className="bg-light p-2 rounded" style={{ maxHeight: 260, overflow: 'auto' }}>{JSON.stringify({
                  buyer: detail.user,
                  items: detail.items,
                  payment: { method: detail.payment_method, status: detail.payment_status },
                }, null, 2)}</pre>
              </Col>
            </Row>
          ) : 'Đang tải...'}
        </Modal.Body>
      </Modal>

      <Modal show={refundModal} onHide={()=>setRefundModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Hoàn tiền</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Số tiền (VND)</Form.Label>
            <Form.Control type="number" value={refundAmount} onChange={(e)=>setRefundAmount(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Ghi chú</Form.Label>
            <Form.Control as="textarea" rows={3} value={refundNote} onChange={(e)=>setRefundNote(e.target.value)} />
          </Form.Group>
          <div className="text-muted small mt-2">Yêu cầu quyền FINANCE hoặc SUPER_ADMIN.</div>
        </Modal.Body>
        <div className="px-3 pb-3 d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={()=>setRefundModal(false)}>Hủy</Button>
          <Button variant="danger" onClick={doRefund}>Xác nhận</Button>
        </div>
      </Modal>
    </Container>
  );
};

export default Orders;
