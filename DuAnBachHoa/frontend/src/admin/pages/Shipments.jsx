import React, { useEffect, useState } from 'react';
import { listAllShipments, assignShipment, listUsers } from '../../services/adminService';

export default function AdminShipments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignees, setAssignees] = useState({});
  const [shippers, setShippers] = useState([]);
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllShipments();
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);
  useEffect(() => {
    (async () => {
      try {
        const users = await listUsers({ role: 'shipper' });
        const pickers = await listUsers({ role: 'picker' });
        setShippers([...(users||[]), ...(pickers||[])]);
      } catch {}
    })();
  }, []);

  const assign = async (id) => {
    const assignee = assignees[id];
    if (!assignee) return;
    await assignShipment(id, assignee);
    setAssignees(prev => ({ ...prev, [id]: '' }));
    await load();
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <h3>Quản lý giao nhận</h3>
      <div style={{ marginBottom: 8 }}>
        <label>
          Lọc trạng thái:
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">-- tất cả --</option>
            <option value="assigned">assigned</option>
            <option value="picked">picked</option>
            <option value="in_transit">in_transit</option>
            <option value="delivered">delivered</option>
            <option value="failed">failed</option>
          </select>
        </label>
      </div>
      <table border="1" cellPadding="8" style={{ borderCollapse:'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Order</th>
            <th>Trạng thái</th>
            <th>Assignee</th>
            <th>Gán shipper</th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.order}</td>
              <td>{s.status}</td>
              <td>{s.assignee || '-'}</td>
              <td>
                <select value={assignees[s.id] || ''} onChange={(e)=>setAssignees(prev=>({ ...prev, [s.id]: e.target.value }))}>
                  <option value="">-- chọn shipper/picker --</option>
                  {shippers.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                  ))}
                </select>
                <button onClick={() => assign(s.id)} style={{ marginLeft: 8 }}>Gán</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
