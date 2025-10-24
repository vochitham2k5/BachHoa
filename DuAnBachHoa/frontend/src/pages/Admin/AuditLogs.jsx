import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Container, Form, Table } from 'react-bootstrap';
import api from '../../services/api';
import { useAdminUI } from '../../contexts/AdminUIContext';

const AuditLogs = () => {
  const { setTitle } = useAdminUI();
  const [items, setItems] = useState([]);
  const [action, setAction] = useState('');
  const [adminId, setAdminId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = async () => {
    const params = { action: action || undefined, adminId: adminId || undefined, from: from || undefined, to: to || undefined };
    const res = await api.get('/api/admin/audit-logs/', { params });
    setItems(res.data || []);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTitle('Audit Logs'); fetchLogs(); }, [setTitle]);

  return (
    <Container className="py-3">
      <Card className="shadow-sm mb-3">
        <Card.Body>
          <div className="d-flex flex-wrap gap-2 align-items-end">
            <Form.Group>
              <Form.Label>Action</Form.Label>
              <Form.Control placeholder="e.g. APPLICATION_APPROVE" value={action} onChange={(e)=>setAction(e.target.value)} style={{ minWidth: 220 }} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Admin ID</Form.Label>
              <Form.Control type="number" value={adminId} onChange={(e)=>setAdminId(e.target.value)} style={{ width: 140 }} />
            </Form.Group>
            <Form.Group>
              <Form.Label>From</Form.Label>
              <Form.Control type="datetime-local" value={from} onChange={(e)=>setFrom(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>To</Form.Label>
              <Form.Control type="datetime-local" value={to} onChange={(e)=>setTo(e.target.value)} />
            </Form.Group>
            <Button variant="outline-secondary" onClick={fetchLogs}>Lọc</Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          <Table striped hover responsive className="mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {items.map(l => (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                  <td>#{l.admin?.id} {l.admin?.email || l.admin?.username}</td>
                  <td><Badge bg="light" text="dark">{l.action}</Badge></td>
                  <td>{l.resource_type}#{l.resource_id}</td>
                  <td><pre className="bg-light p-2 rounded" style={{ maxWidth: 420, maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(l.meta, null, 2)}</pre></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AuditLogs;
