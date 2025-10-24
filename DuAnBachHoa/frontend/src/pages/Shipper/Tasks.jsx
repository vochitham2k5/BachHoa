import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Container } from 'react-bootstrap';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const { show } = useToast();
  const fetchTasks = async () => { const res = await api.get('/shipper/tasks'); setTasks(res.data || []); };
  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (id, status) => { await api.put(`/shipper/tasks/${id}/status`, { status }); show('Cập nhật trạng thái thành công'); fetchTasks(); };

  return (
    <Container className="py-3">
      {tasks.map(t => (
        <Card className="shadow-sm mb-2" key={t.id}>
          <Card.Body className="d-flex justify-content-between align-items-center">
            <div>
              <div className="fw-bold">Đơn {t.id}</div>
              <div>Tổng: {t.total?.toLocaleString()} ₫</div>
            </div>
            <div>
              <Badge bg="secondary" className="me-2">{t.status}</Badge>
              <Button size="sm" className="me-1" onClick={() => updateStatus(t.id, 'PICKED')}>Đã lấy</Button>
              <Button size="sm" className="me-1" onClick={() => updateStatus(t.id, 'ENROUTE')}>Đang giao</Button>
              <Button size="sm" variant="success" className="me-1" onClick={() => updateStatus(t.id, 'DELIVERED')}>Giao xong</Button>
              <Button size="sm" variant="outline-danger" onClick={() => updateStatus(t.id, 'FAILED')}>Thất bại</Button>
            </div>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default Tasks;
