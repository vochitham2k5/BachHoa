import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, ListGroup, Row } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Minimal seller chat: list threads and chat with selected buyer
const SellerChat = () => {
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const { user } = useAuth();

  // Simple endpoint reuse: we don't have a seller-list-threads API; fetch from last messages by trying known threads isn't feasible.
  // For now, we allow seller to open a chat by typing buyer email.
  const [buyerEmail, setBuyerEmail] = useState('');

  // Poll threads list so seller sees new incoming chats
  useEffect(() => {
    let timer;
    const load = async () => {
      try {
        const res = await api.get('/api/chat/seller/threads');
        const items = res.data.items || [];
        setThreads(items);
        if (!active && items.length > 0) setActive(items[0].id);
      } catch {}
      timer = setTimeout(load, 5000);
    };
    load();
    return () => clearTimeout(timer);
  }, [active]);

  const openManual = async () => {
    if (!buyerEmail.trim()) return;
    // Admin/seller does not know sellerId directly? Backend chat_open_thread needs sellerId.
    // Here seller opens chat with self; backend will create or fetch thread when buyer sends later.
    // As a minimal tool, we just set active to null and wait for incoming chats.
  };

  useEffect(() => {
    if (!active) return;
    let timer;
    const load = async () => {
      const res = await api.get(`/api/chat/threads/${active}/messages`);
      setMessages(res.data.items || []);
      timer = setTimeout(load, 3000);
    };
    load();
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <Container className="py-3">
      <Row>
        <Col md={4}>
          <Card className="mb-3">
            <Card.Header>Cuộc trò chuyện</Card.Header>
            <ListGroup variant="flush">
              {threads.map(t => (
                <ListGroup.Item key={t.id} action active={active===t.id} onClick={()=>setActive(t.id)}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{t.buyerName || 'Khách'}</div>
                      <div className="small text-muted text-truncate" style={{maxWidth: '18ch'}}>{t.lastBody || 'Bắt đầu cuộc trò chuyện'}</div>
                    </div>
                    {t.unread > 0 && <Badge bg="danger">{t.unread}</Badge>}
                  </div>
                </ListGroup.Item>
              ))}
              {threads.length===0 && <ListGroup.Item className="text-muted small">Chưa có cuộc trò chuyện.</ListGroup.Item>}
            </ListGroup>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Header>Chat với khách</Card.Header>
            <Card.Body style={{ minHeight: 320 }}>
              {active ? (
                messages.map(m => {
                  const mine = m.senderId === user?.id;
                  return (
                  <div key={m.id} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                    <div className={`px-3 py-2 rounded ${mine ? 'bg-primary text-white' : 'bg-light'}`}>
                      <div className="small">{m.body}</div>
                      <div className="small text-muted text-end">{new Date(m.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );})
              ) : (
                <div className="text-muted">Chưa chọn cuộc trò chuyện.</div>
              )}
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={async (e)=>{ e.preventDefault(); if (!active || !body.trim()) return; const b=body; setBody(''); await api.post(`/api/chat/threads/${active}/messages`, { body: b }); const res = await api.get(`/api/chat/threads/${active}/messages`); setMessages(res.data.items || []); }}>
                <div className="d-flex gap-2">
                  <Form.Control value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Nhập tin nhắn…" />
                  <Button type="submit">Gửi</Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SellerChat;
