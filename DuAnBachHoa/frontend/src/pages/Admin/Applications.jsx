import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Stack } from 'react-bootstrap';
import api from '../../services/api';
import { emitAdminEvent } from '../../contexts/AdminBus';
import { useAdminUI } from '../../contexts/AdminUIContext';

const Applications = () => {
  const { setTitle, setActions } = useAdminUI();
  const [apps, setApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({ status: 'PENDING', type: '' });
  const [modal, setModal] = useState({ type: null });

  const fetchApps = useCallback(async () => {
    const res = await api.get('/api/admin/applications/', { params: { status: filters.status || undefined, type: filters.type || undefined } });
    setApps(res.data || []);
  }, [filters.status, filters.type]);

  useEffect(() => {
    setTitle('Applications');
    setActions(
      <Button size="sm" variant="outline-secondary" onClick={fetchApps}>
        Refresh
      </Button>
    );
    return () => setActions(null);
  }, [setTitle, setActions, fetchApps]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const approve = async (payload={}) => { if (!selected) return; await api.put(`/api/admin/applications/${selected}/approve/`, payload); setSelected(null); setDetail(null); setModal({type:null}); fetchApps(); emitAdminEvent('admin:refreshCounts'); };
  const reject = async (reason) => { if (!selected) return; await api.put(`/api/admin/applications/${selected}/reject/`, { reason }); setSelected(null); setDetail(null); setModal({type:null}); fetchApps(); emitAdminEvent('admin:refreshCounts'); };
  const requestInfo = async (reviewNotes) => { if (!selected) return; await api.put(`/api/admin/applications/${selected}/request-info/`, { reviewNotes }); setModal({type:null}); fetchApps(); emitAdminEvent('admin:refreshCounts'); };

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    (async () => {
      const res = await api.get(`/api/admin/applications/${selected}/`);
      setDetail(res.data);
    })();
  }, [selected]);

  return (
    <Container className="py-3">
      <Card className="mb-3">
        <Card.Body>
          <Stack direction="horizontal" gap={2}>
            <Form.Select size="sm" value={filters.status} onChange={(e)=>setFilters(f=>({...f,status:e.target.value}))} style={{maxWidth:180}}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="AWAITING_INFO">Awaiting info</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Form.Select>
            <Form.Select size="sm" value={filters.type} onChange={(e)=>setFilters(f=>({...f,type:e.target.value}))} style={{maxWidth:180}}>
              <option value="">All types</option>
              <option value="SELLER">Seller</option>
              <option value="SHIPPER">Shipper</option>
            </Form.Select>
            <Button size="sm" variant="outline-secondary" onClick={fetchApps}>Refresh</Button>
          </Stack>
        </Card.Body>
      </Card>
      <Row className="g-2">
        {apps.map(a => (
          <Col md={6} key={a.id}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between">
                  <div>
                    <div className="fw-bold">Ứng tuyển: {a.id}</div>
                    <div><Badge bg="info">{a.type}</Badge></div>
                  </div>
                  <div>
                    <Button size="sm" className="me-2" onClick={() => setSelected(a.id)}>Xem</Button>
                    <Button size="sm" variant="success" className="me-2" onClick={() => { setSelected(a.id); setModal({type:'approve'})}}>Duyệt</Button>
                    <Button size="sm" variant="outline-danger" className="me-2" onClick={() => { setSelected(a.id); setModal({type:'reject'})}}>Từ chối</Button>
                    <Button size="sm" variant="outline-warning" onClick={() => { setSelected(a.id); setModal({type:'request'})}}>Yêu cầu bổ sung</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal show={!!selected} onHide={() => setSelected(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>Chi tiết ứng tuyển</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-2"><strong>ID:</strong> {selected}</div>
          {detail ? (
            <>
              <div className="mb-2"><strong>Loại:</strong> {detail.type}</div>
              <div className="mb-2"><strong>Trạng thái:</strong> {detail.status}</div>
              <pre className="bg-light p-2 rounded" style={{ maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(detail.data, null, 2)}</pre>
            </>
          ) : (
            'Đang tải...'
          )}
        </Modal.Body>
        <div className="px-3 pb-3">
          <Button size="sm" className="me-2" onClick={() => setModal({type:'approve'})}>Duyệt</Button>
          <Button size="sm" variant="outline-danger" className="me-2" onClick={() => setModal({type:'reject'})}>Từ chối</Button>
          <Button size="sm" variant="outline-warning" onClick={() => setModal({type:'request'})}>Yêu cầu bổ sung</Button>
        </div>
      </Modal>

      {/* Approve Modal */}
      <ApproveModal show={modal.type==='approve'} onHide={()=>setModal({type:null})} detail={detail} onConfirm={approve} />
      {/* Reject Modal */}
      <RejectModal show={modal.type==='reject'} onHide={()=>setModal({type:null})} onConfirm={reject} />
      {/* Request Info Modal */}
      <RequestInfoModal show={modal.type==='request'} onHide={()=>setModal({type:null})} onConfirm={requestInfo} />
    </Container>
  );
};

const ApproveModal = ({ show, onHide, detail, onConfirm }) => {
  const [commission, setCommission] = useState('');
  const [initialConfig, setInitialConfig] = useState('');
  const isSeller = (detail?.type === 'SELLER');
  const payload = useMemo(() => {
    const p = {};
    if (isSeller && commission) p.commissionPercent = parseFloat(commission);
    if (isSeller && initialConfig) {
      try { p.initialConfig = JSON.parse(initialConfig); } catch (_) {}
    }
    return p;
  }, [commission, initialConfig, isSeller]);
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>Duyệt ứng tuyển</Modal.Title></Modal.Header>
      <Modal.Body>
        {isSeller ? (
          <>
            <Form.Group className="mb-2">
              <Form.Label>Commission % (optional)</Form.Label>
              <Form.Control type="number" min={0} max={100} value={commission} onChange={(e)=>setCommission(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Initial Config JSON (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} placeholder='{"tier":"standard"}' value={initialConfig} onChange={(e)=>setInitialConfig(e.target.value)} />
            </Form.Group>
          </>
        ) : (
          <div>Confirm approve this application?</div>
        )}
      </Modal.Body>
      <div className="px-3 pb-3 d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide}>Hủy</Button>
        <Button onClick={()=>onConfirm(payload)}>
          Xác nhận
        </Button>
      </div>
    </Modal>
  );
};

const RejectModal = ({ show, onHide, onConfirm }) => {
  const [reason, setReason] = useState('Không đủ thông tin');
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>Từ chối ứng tuyển</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Lý do</Form.Label>
          <Form.Control as="textarea" rows={3} value={reason} onChange={(e)=>setReason(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <div className="px-3 pb-3 d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide}>Hủy</Button>
        <Button variant="danger" onClick={()=>onConfirm(reason)}>Xác nhận</Button>
      </div>
    </Modal>
  );
};

const RequestInfoModal = ({ show, onHide, onConfirm }) => {
  const [notes, setNotes] = useState('Vui lòng bổ sung giấy tờ');
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>Yêu cầu bổ sung</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Ghi chú tới ứng viên</Form.Label>
          <Form.Control as="textarea" rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </Form.Group>
      </Modal.Body>
      <div className="px-3 pb-3 d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide}>Hủy</Button>
        <Button variant="warning" onClick={()=>onConfirm(notes)}>Gửi yêu cầu</Button>
      </div>
    </Modal>
  );
};

export default Applications;
