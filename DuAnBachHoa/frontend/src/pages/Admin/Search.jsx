import React, { useEffect, useState } from 'react';
import { Badge, Card, Container, Tab, Table, Tabs } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useAdminUI } from '../../contexts/AdminUIContext';

const useQuery = () => new URLSearchParams(useLocation().search);

const Search = () => {
  const { setTitle } = useAdminUI();
  const q = useQuery().get('q') || '';
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [apps, setApps] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => { setTitle(`Search: ${q}`); }, [q, setTitle]);

  useEffect(() => {
    if (!q) return;
    (async () => {
      try {
        const [usersRes, ordersRes, appsRes, productsRes] = await Promise.all([
          api.get('/api/admin/users/', { params: { query: q } }),
          api.get('/api/admin/orders/', { params: { q } }),
          api.get('/api/admin/applications/', {}),
          api.get('/api/admin/products/'),
        ]);
        setUsers(usersRes.data || []);
        setOrders(ordersRes.data || []);
        setApps((appsRes.data || []).filter(a => `${a.id}`.includes(q) || JSON.stringify(a.data).toLowerCase().includes(q.toLowerCase())));
        const allProducts = productsRes.data || [];
        const norm = (s) => (s || '').toString().toLowerCase();
        setProducts(allProducts.filter(p => norm(p.name).includes(q.toLowerCase()) || `${p.id}`.includes(q)));
      } catch (e) {
        setUsers([]); setOrders([]); setApps([]); setProducts([]);
      }
    })();
  }, [q]);

  return (
    <Container className="py-3">
      <Tabs defaultActiveKey="users" className="mb-3">
        <Tab eventKey="users" title={<span>Users <Badge bg="secondary">{users.length}</Badge></span>}>
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped hover responsive className="mb-0">
                <thead><tr><th>ID</th><th>Email</th><th>Roles</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{(u.roles||[]).join(', ')}</td></tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="orders" title={<span>Orders <Badge bg="secondary">{orders.length}</Badge></span>}>
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped hover responsive className="mb-0">
                <thead><tr><th>ID</th><th>Status</th><th>Total</th><th>Created</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}><td>{o.id}</td><td>{o.status}</td><td>{o.total}</td><td>{new Date(o.created_at).toLocaleString()}</td></tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="applications" title={<span>Applications <Badge bg="secondary">{apps.length}</Badge></span>}>
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped hover responsive className="mb-0">
                <thead><tr><th>ID</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.id}><td>{a.id}</td><td>{a.type}</td><td>{a.status}</td></tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="products" title={<span>Products <Badge bg="secondary">{products.length}</Badge></span>}>
          <Card className="shadow-sm">
            <Card.Body>
              <Table striped hover responsive className="mb-0">
                <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td>{p.sale_price ?? p.price}</td><td>{p.stock}</td></tr>
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

export default Search;
