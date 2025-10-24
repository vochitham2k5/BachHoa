import React, { useEffect, useState, useCallback } from 'react';
import { Badge, Button, Card, Container, Form, InputGroup, Modal, Table } from 'react-bootstrap';
import api from '../../services/api';
import { useAdminUI } from '../../contexts/AdminUIContext';

const Users = () => {
  const { setTitle } = useAdminUI();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [banModal, setBanModal] = useState(false);
  const [banReason, setBanReason] = useState('Vi phạm điều khoản');

  const fetchUsers = useCallback(async () => {
    const res = await api.get('/api/admin/users/', { params: { query: query || undefined } });
    setUsers(res.data || []);
  }, [query]);
  useEffect(() => { setTitle('Users'); }, [setTitle]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openBan = (u) => { setSelected(u); setBanModal(true); };
  const doBan = async () => { if (!selected) return; await api.post(`/api/admin/users/${selected.id}/ban/`, { reason: banReason }); setBanModal(false); fetchUsers(); };
  const doUnban = async (u) => { await api.post(`/api/admin/users/${u.id}/ban/`, { unban: true }); fetchUsers(); };
  const impersonate = async (u) => {
    if (!window.confirm(`Impersonate user #${u.id}? This will replace your token.`)) return;
    const res = await api.post(`/api/admin/users/${u.id}/impersonate/`);
    const { token } = res.data || {};
    if (token) { localStorage.setItem('token', token); window.location.href = '/'; }
  };

  return (
    <Container className="py-3">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title className="mb-0">Người dùng</Card.Title>
            <InputGroup style={{ maxWidth: 360 }}>
              <Form.Control placeholder="Tìm theo email/phone" value={query} onChange={(e)=>setQuery(e.target.value)} />
              <Button variant="outline-secondary" onClick={fetchUsers}>Tìm</Button>
            </InputGroup>
          </div>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Admin</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{(u.roles || []).map(r => (<Badge key={r} bg="secondary" className="me-1">{r}</Badge>))}</td>
                  <td>{u.is_admin ? 'Yes' : 'No'}</td>
                  <td>{u.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="danger">Banned</Badge>}</td>
                  <td className="text-end">
                    {u.is_active ? (
                      <Button size="sm" variant="outline-danger" className="me-2" onClick={()=>openBan(u)}>Ban</Button>
                    ) : (
                      <Button size="sm" variant="outline-success" className="me-2" onClick={()=>doUnban(u)}>Unban</Button>
                    )}
                    <Button size="sm" variant="outline-secondary" onClick={()=>impersonate(u)}>Impersonate</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={banModal} onHide={()=>setBanModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Khóa tài khoản</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-2">Người dùng: <strong>{selected?.username}</strong></div>
          <Form.Group>
            <Form.Label>Lý do</Form.Label>
            <Form.Control as="textarea" rows={3} value={banReason} onChange={(e)=>setBanReason(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <div className="px-3 pb-3 d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={()=>setBanModal(false)}>Hủy</Button>
          <Button variant="danger" onClick={doBan}>Xác nhận</Button>
        </div>
      </Modal>
    </Container>
  );
};

export default Users;
