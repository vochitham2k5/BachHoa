import React, { useEffect, useState, useCallback } from 'react';
import { Badge, Button, ButtonGroup, Card, Container, Dropdown, Tab, Table, Tabs } from 'react-bootstrap';
import api from '../../services/api';
import { emitAdminEvent } from '../../contexts/AdminBus';
import { useAdminUI } from '../../contexts/AdminUIContext';

const Products = () => {
  const { setTitle, setActions } = useAdminUI();
  const [items, setItems] = useState([]);
  const [flags, setFlags] = useState([]);
  const fetchData = useCallback(async () => { const res = await api.get('/api/admin/products/'); setItems(res.data || []); }, []);
  const fetchFlags = useCallback(async () => { const res = await api.get('/api/admin/products/flags/'); setFlags(res.data || []); }, []);
  const refresh = useCallback(async () => { await Promise.all([fetchData(), fetchFlags()]); }, [fetchData, fetchFlags]);
  useEffect(() => { setTitle('Products'); refresh(); setActions(<Button size="sm" variant="outline-secondary" onClick={refresh}>Refresh</Button>); return () => setActions(null); }, [setTitle, refresh, setActions]);

  const remove = async (id) => { await api.delete(`/api/admin/products/${id}/`); fetchData(); emitAdminEvent('admin:refreshCounts'); };
  const moderate = async (id, action) => { await api.post(`/api/admin/products/${id}/moderate/`, { action }); fetchData(); fetchFlags(); emitAdminEvent('admin:refreshCounts'); };

  return (
    <Container className="py-3">
      <Tabs defaultActiveKey="flags" className="mb-3">
        <Tab eventKey="flags" title={<span>Flags <Badge bg="secondary">{flags.length}</Badge></span>}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Flags mở</Card.Title>
              <Table striped hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Reason</th>
                    <th>By</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map(f => (
                    <tr key={f.id}>
                      <td>{f.id}</td>
                      <td>#{f.product?.id} {f.product?.name}</td>
                      <td>{f.reason}</td>
                      <td>{f.created_by || '-'}</td>
                      <td className="text-end">
                        <Dropdown as={ButtonGroup} size="sm">
                          <Button variant="outline-secondary">Moderate</Button>
                          <Dropdown.Toggle split variant="outline-secondary" />
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={()=>moderate(f.product?.id,'remove')}>Remove product</Dropdown.Item>
                            <Dropdown.Item onClick={()=>moderate(f.product?.id,'warn')}>Warn seller</Dropdown.Item>
                            <Dropdown.Item onClick={()=>moderate(f.product?.id,'suspend_seller')}>Suspend seller</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="all" title="All products">
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Tất cả sản phẩm</Card.Title>
              <Table striped hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{(p.sale_price ?? p.price).toLocaleString()} ₫</td>
                      <td>{p.stock}</td>
                      <td className="text-end">
                        <Button size="sm" variant="outline-danger" className="me-2" onClick={() => remove(p.id)}>Xóa</Button>
                        <Dropdown as={ButtonGroup} size="sm">
                          <Button variant="outline-secondary">Moderate</Button>
                          <Dropdown.Toggle split variant="outline-secondary" />
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={()=>moderate(p.id,'remove')}>Remove product</Dropdown.Item>
                            <Dropdown.Item onClick={()=>moderate(p.id,'warn')}>Warn seller</Dropdown.Item>
                            <Dropdown.Item onClick={()=>moderate(p.id,'suspend_seller')}>Suspend seller</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Products;
