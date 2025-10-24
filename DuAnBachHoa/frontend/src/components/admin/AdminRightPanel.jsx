import React, { useEffect, useState } from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';
import api from '../../services/api';

const AdminRightPanel = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/admin/audit-logs/');
        setLogs((res.data || []).slice(0, 6));
      } catch (_) {
        setLogs([]);
      }
    })();
  }, []);
  return (
    <aside aria-label="Admin insights panel" className="h-100">
      <Card className="h-100 rounded-0">
        <Card.Header>Recent Activity</Card.Header>
        <ListGroup variant="flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {logs.map((l) => (
            <ListGroup.Item key={l.id} className="small">
              <div className="d-flex justify-content-between">
                <div>
                  <Badge bg="light" text="dark" className="me-2">{l.action}</Badge>
                  <span className="text-muted">{l.resource_type}#{l.resource_id}</span>
                </div>
                <span className="text-muted">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            </ListGroup.Item>
          ))}
          {logs.length === 0 && <ListGroup.Item className="text-muted">No recent logs</ListGroup.Item>}
        </ListGroup>
      </Card>
    </aside>
  );
};

export default AdminRightPanel;
