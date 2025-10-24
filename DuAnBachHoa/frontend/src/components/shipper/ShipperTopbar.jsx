import React, { useEffect, useState } from 'react';
import { Navbar, Container, Form, Button, Badge } from 'react-bootstrap';
import api from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';

const ShipperTopbar = ({ onToggleMap, showMap }) => {
  const [available, setAvailable] = useState(() => localStorage.getItem('shipper_available') === '1');
  const [orderId, setOrderId] = useState('');
  const [earnings, setEarnings] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/shipper/earnings');
        setEarnings(res.data?.total || 0);
      } catch {}
    })();
  }, []);

  const toggleAvailability = async () => {
    const next = !available;
    setAvailable(next);
    localStorage.setItem('shipper_available', next ? '1' : '0');
    try {
      await api.put('/api/shipper/profile/', { available: next });
    } catch (e) {
      // revert on failure
      const prev = !next; setAvailable(prev); localStorage.setItem('shipper_available', prev ? '1' : '0');
    }
  };

  const onSearch = (e) => {
    e.preventDefault();
    if (!orderId) return;
    navigate(`/shipper/active?q=${encodeURIComponent(orderId)}`);
  };

  return (
    <Navbar bg="white" className="border-bottom py-2" sticky="top">
      <Container fluid>
        <Navbar.Brand as={Link} to="/shipper">Shipper</Navbar.Brand>
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <Form onSubmit={onSearch} className="d-flex align-items-center gap-2">
            <Form.Check type="switch" id="online-switch" label={available ? 'Online' : 'Offline'} checked={available} onChange={toggleAvailability} />
            <Form.Control size="sm" style={{ maxWidth: 220 }} placeholder="Tìm mã đơn" value={orderId} onChange={e => setOrderId(e.target.value)} />
            <Button size="sm" type="submit" variant="primary">Tìm</Button>
          </Form>
          <Button size="sm" variant="outline-secondary" onClick={onToggleMap}>{showMap ? 'Ẩn bản đồ' : 'Hiển thị bản đồ'}</Button>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="text-nowrap">Thu nhập: <Badge bg="success">{earnings.toLocaleString()} đ</Badge></div>
          <Button size="sm" as={Link} to="/shipper/profile" variant="outline-secondary">Hồ sơ</Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default ShipperTopbar;
