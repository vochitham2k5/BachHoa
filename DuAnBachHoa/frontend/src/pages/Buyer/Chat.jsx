import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const BuyerChat = () => {
  const { sellerId } = useParams();
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const open = await api.post(`/api/chat/threads/${sellerId}/open`);
        setThreadId(open.data.threadId);
      } finally {
        setLoading(false);
      }
    })();
  }, [sellerId]);

  useEffect(() => {
    if (!threadId) return;
    let timer;
    const load = async () => {
      try {
        const res = await api.get(`/api/chat/threads/${threadId}/messages`);
        setMessages(res.data.items || []);
      } catch {}
      timer = setTimeout(load, 3000);
    };
    load();
    return () => clearTimeout(timer);
  }, [threadId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (loading) return <Container className="py-3">Đang mở chat…</Container>;
  if (!threadId) return <Container className="py-3">Không thể mở cuộc chat.</Container>;

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Header>Chat với Shop</Card.Header>
            <Card.Body style={{ minHeight: 320, maxHeight: 480, overflowY: 'auto' }}>
              {messages.map(m => {
                const mine = m.senderId === user?.id;
                return (
                <div key={m.id} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                  <div className={`px-3 py-2 rounded ${mine ? 'bg-primary text-white' : 'bg-light'}`}>
                    <div className="small">{m.body}</div>
                    <div className="small text-muted text-end">{new Date(m.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              );})}
              <div ref={endRef} />
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={async (e)=>{ e.preventDefault(); if (!body.trim()) return; const b=body; setBody(''); await api.post(`/api/chat/threads/${threadId}/messages`, { body: b }); const res = await api.get(`/api/chat/threads/${threadId}/messages`); setMessages(res.data.items || []); }}>
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

export default BuyerChat;
