import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Badge, Button, Card, Col, Container, Form, Modal, Row, Stack, InputGroup } from 'react-bootstrap';
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
              <div className="mb-3"><strong>Trạng thái:</strong> {detail.status}</div>
              <ApplicationDetailView type={detail.type} data={detail.data || {}} />
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
  const [errors, setErrors] = useState({ commission: '', json: '' });
  const isSeller = (detail?.type === 'SELLER');

  // Validate commission & JSON live
  const cNum = commission === '' ? null : Number(commission);
  const commissionInvalid = commission !== '' && (Number.isNaN(cNum) || cNum < 0 || cNum > 100);
  const jsonInvalid = (() => {
    if (!initialConfig) return false;
    try { JSON.parse(initialConfig); return false; } catch { return true; }
  })();

  useEffect(() => {
    setErrors({
      commission: commissionInvalid ? 'Giá trị phải từ 0 đến 100' : '',
      json: jsonInvalid ? 'JSON không hợp lệ' : ''
    });
  }, [commissionInvalid, jsonInvalid]);

  const payload = useMemo(() => {
    const p = {};
    if (isSeller && commission !== '' && !commissionInvalid) p.commissionPercent = parseFloat(commission);
    if (isSeller && initialConfig && !jsonInvalid) {
      try { p.initialConfig = JSON.parse(initialConfig); } catch (_) {}
    }
    return p;
  }, [commission, commissionInvalid, initialConfig, jsonInvalid, isSeller]);
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>Duyệt ứng tuyển</Modal.Title></Modal.Header>
      <Modal.Body>
        {isSeller ? (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Phần trăm hoa hồng (tùy chọn)</Form.Label>
              <InputGroup>
                <Form.Control type="number" inputMode="decimal" step="0.1" min={0} max={100} value={commission} onChange={(e)=>setCommission(e.target.value)} placeholder="0" aria-label="Hoa hồng" />
                <InputGroup.Text>%</InputGroup.Text>
              </InputGroup>
              {errors.commission && <div className="text-danger small mt-1">{errors.commission}</div>}
              <Form.Text className="text-muted">Để trống nếu dùng mặc định hệ thống.</Form.Text>
            </Form.Group>
            <Form.Group>
              <Form.Label>Cấu hình khởi tạo (JSON, tùy chọn)</Form.Label>
              <Form.Control as="textarea" rows={4} placeholder='{"tier":"standard"}' value={initialConfig} onChange={(e)=>setInitialConfig(e.target.value)} />
              {errors.json && <div className="text-danger small mt-1">{errors.json}</div>}
              <Form.Text className="text-muted">Ví dụ: {`{"tier":"standard"}`} hoặc để trống.</Form.Text>
            </Form.Group>
          </>
        ) : (
          <div>Confirm approve this application?</div>
        )}
      </Modal.Body>
      <div className="px-3 pb-3 d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onHide}>Hủy</Button>
        <Button onClick={()=>onConfirm(payload)} disabled={Boolean(errors.commission || errors.json)}>Xác nhận</Button>
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

// ----- Helpers -----
const Field = ({ label, value }) => (
  <Form.Group as={Col} md={6} className="mb-3">
    <Form.Label className="text-muted small mb-1">{label}</Form.Label>
    <Form.Control value={value ?? ''} readOnly plaintext={false} />
  </Form.Group>
);

const ApplicationDetailView = ({ type, data }) => {
  // Hide long base64 or large blobs by replacing with a short tag
  const prettyVal = (k, v) => {
    if (v == null) return '';
    if (typeof v === 'string' && v.startsWith('data:')) return 'Đã đính kèm tệp';
    if (/image|license|base64/i.test(k) && typeof v === 'string') return 'Đã đính kèm tệp';
    return v;
  };

  if (type === 'SELLER') {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Row>
            <Field label="Họ tên" value={prettyVal('fullName', data.fullName)} />
            <Field label="Email" value={prettyVal('email', data.email)} />
            <Field label="Số điện thoại" value={prettyVal('phone', data.phone)} />
            <Field label="Tên cửa hàng" value={prettyVal('shopName', data.shopName)} />
            <Field label="Danh mục chính" value={prettyVal('shopCategory', data.shopCategory)} />
            <Field label="Địa chỉ kho" value={prettyVal('shopAddress', data.shopAddress)} />
            <Field label="Ngân hàng" value={prettyVal('bankName', data.bankName)} />
            <Field label="Số tài khoản" value={prettyVal('bankAccount', data.bankAccount)} />
            <Field label="Giấy phép KD" value={prettyVal('licenseImageBase64', data.licenseImageBase64)} />
            <Field label="Logo cửa hàng" value={prettyVal('logoBase64', data.logoBase64)} />
          </Row>
        </Card.Body>
      </Card>
    );
  }

  if (type === 'SHIPPER') {
    return (
      <Card className="shadow-sm">
        <Card.Body>
          <Row>
            <Field label="Họ tên" value={prettyVal('fullName', data.fullName)} />
            <Field label="Email" value={prettyVal('email', data.email)} />
            <Field label="Số điện thoại" value={prettyVal('phone', data.phone)} />
            <Field label="Loại phương tiện" value={prettyVal('vehicleType', data.vehicleType)} />
            <Field label="Biển số" value={prettyVal('plateNumber', data.plateNumber)} />
            <Field label="Khu vực hoạt động" value={prettyVal('activeArea', data.activeArea)} />
            <Field label="GPLX" value={prettyVal('licenseImageBase64', data.licenseImageBase64)} />
            <Field label="Ảnh phương tiện" value={prettyVal('vehiclePhotoBase64', data.vehiclePhotoBase64)} />
            <Field label="CMND/CCCD trước" value={prettyVal('idCardFrontBase64', data.idCardFrontBase64)} />
            <Field label="CMND/CCCD sau" value={prettyVal('idCardBackBase64', data.idCardBackBase64)} />
            <Field label="Ảnh chân dung" value={prettyVal('profilePhotoBase64', data.profilePhotoBase64)} />
          </Row>
        </Card.Body>
      </Card>
    );
  }

  // Fallback generic key/value grid
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Row>
          {Object.entries(data || {}).map(([k, v]) => (
            <Field key={k} label={k} value={prettyVal(k, v)} />
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
};
